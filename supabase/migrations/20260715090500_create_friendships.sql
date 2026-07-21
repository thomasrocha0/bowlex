-- Friendships: a connection between two profiles. Blocking is handled by a
-- separate public.blocks table (see 20260715090450_create_blocks.sql), not
-- a status here -- a block has no acceptance step and must be able to
-- coexist independently of whatever friendship/request state (if any)
-- already exists between the two users.
create type public.friendship_status as enum ('pending', 'accepted');

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id)
);

-- At most one pending invitation per *ordered* pair -- so A can have a
-- pending invite to B at the same time B has one to A (each gets its own
-- row), but A can't send B a second one while the first is still pending.
create unique index friendships_unique_pending_idx
  on public.friendships (requester_id, addressee_id)
  where status = 'pending';

-- At most one accepted friendship per *unordered* pair. accept_friend_request
-- below is what keeps this true in practice -- it deletes the reverse
-- pending row in the same transaction it accepts the first one, so an
-- accepted pair never ends up with a leftover pending row sitting next to it.
create unique index friendships_unique_accepted_pair_idx
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id))
  where status = 'accepted';

create index friendships_requester_id_idx on public.friendships (requester_id);
create index friendships_addressee_id_idx on public.friendships (addressee_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger friendships_set_updated_at
  before update on public.friendships
  for each row
  execute function public.set_updated_at();

-- The single UPDATE policy below only re-validates addressee_id and status
-- in its WITH CHECK, not that requester_id was left alone -- pin both party
-- columns explicitly so that update can't also smuggle in a party change.
create or replace function public.prevent_friendship_party_change()
returns trigger
language plpgsql
as $$
begin
  if new.requester_id <> old.requester_id or new.addressee_id <> old.addressee_id then
    raise exception 'requester_id and addressee_id cannot be changed after creation';
  end if;
  return new;
end;
$$;

create trigger friendships_prevent_party_change
  before update on public.friendships
  for each row
  execute function public.prevent_friendship_party_change();

alter table public.friendships enable row level security;

-- Symmetric: hides a friendships row from *both* parties whenever a block
-- exists between them in either direction, not just from whichever side is
-- the blocked one. This is what makes a blocked user's request actually
-- inert -- see the INSERT policy below for why enforcement happens here
-- rather than by rejecting the insert.
create policy "Either party can view a friendship, unless blocked"
  on public.friendships for select
  to authenticated
  using (
    (requester_id = auth.uid() or addressee_id = auth.uid())
    and not public.is_blocked_by(requester_id, addressee_id)
    and not public.is_blocked_by(addressee_id, requester_id)
  );

-- Deliberately does NOT check is_blocked_by: rejecting the insert would
-- make a blocked user's well-formed request fail with a distinct RLS error
-- where an unblocked user's identical request succeeds -- a queryable way
-- to confirm "this person blocked me," which is exactly what blocking is
-- supposed to hide. Instead the insert always succeeds, and the SELECT
-- policy above makes the resulting row permanently invisible to both
-- parties, so it never reaches the blocker.
--
-- Gotcha this policy pair creates: Postgres also enforces SELECT policies
-- on an INSERT's RETURNING output, not just WITH CHECK. Since the SELECT
-- policy above can hide a row from its own inserter (a blocked user
-- inserting a request to their blocker), `insert(...).select()` on this
-- table -- the pattern used everywhere else in this codebase -- would raise
-- "new row violates row-level security policy" for exactly that insert,
-- reintroducing the same oracle this comment says the design avoids.
-- useSendFriendRequest works around this by inserting WITHOUT requesting
-- the row back (no RETURNING), so WITH CHECK alone governs success and the
-- SELECT policy is never consulted for that statement.
create policy "Users can send friend requests"
  on public.friendships for insert
  to authenticated
  with check (requester_id = auth.uid() and status = 'pending');

-- The only status transition a client can make directly is pending ->
-- accepted, and only as the addressee (used by accept_friend_request
-- below). Declining, cancelling an outgoing request, and unfriending are
-- all deletes instead -- see the DELETE policy -- so there's no matching
-- policy for pending -> declined.
create policy "Addressee can accept a pending request"
  on public.friendships for update
  to authenticated
  using (addressee_id = auth.uid() and status = 'pending')
  with check (addressee_id = auth.uid() and status = 'accepted');

create policy "Either party can remove a connection"
  on public.friendships for delete
  to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

-- Atomically accepts a pending request and clears out the mirror-image
-- pending row in the other direction (if the addressee had separately sent
-- their own invite to the requester before this one was accepted), so the
-- pair ends up with exactly one row: the new accepted friendship. Runs with
-- the caller's own privileges (not security definer) -- the UPDATE and
-- DELETE it performs are both things the caller is already allowed to do
-- under RLS on their own; this just makes them happen in one transaction.
create or replace function public.accept_friend_request(p_friendship_id uuid)
returns public.friendships
language plpgsql
as $$
declare
  v_row public.friendships;
begin
  update public.friendships
  set status = 'accepted'
  where id = p_friendship_id
    and addressee_id = auth.uid()
    and status = 'pending'
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Friend request not found or not pending';
  end if;

  delete from public.friendships
  where requester_id = v_row.addressee_id
    and addressee_id = v_row.requester_id
    and status = 'pending';

  return v_row;
end;
$$;

grant execute on function public.accept_friend_request(uuid) to authenticated;

-- Blocking auto-removes any existing friendship/pending-request row between
-- the two users (in either direction) so "blocked" is a clean, exclusive
-- state with no stale friendship data left over. Lives here (not in
-- create_blocks.sql) since it needs public.friendships to exist. Runs with
-- the caller's own privileges: the insert into blocks and the delete from
-- friendships are both already things the caller is allowed to do under RLS
-- on their own.
create or replace function public.block_user(p_blocked_id uuid)
returns public.blocks
language plpgsql
as $$
declare
  v_row public.blocks;
begin
  insert into public.blocks (blocker_id, blocked_id)
  values (auth.uid(), p_blocked_id)
  returning * into v_row;

  delete from public.friendships
  where (requester_id = auth.uid() and addressee_id = p_blocked_id)
     or (requester_id = p_blocked_id and addressee_id = auth.uid());

  return v_row;
end;
$$;

grant execute on function public.block_user(uuid) to authenticated;
