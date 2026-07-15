-- Friendships: a connection between two profiles.
create type public.friendship_status as enum ('pending', 'accepted', 'declined', 'blocked');

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id)
);

-- Prevents duplicate requests in either direction between the same two profiles.
create unique index friendships_unique_pair_idx
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

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

-- The accept/decline and block UPDATE policies below are separate permissive
-- policies, which Postgres combines with OR on both USING and WITH CHECK.
-- That means a WITH CHECK on one policy can't see what the *other* policy
-- required of the pre-update row, so on its own it wouldn't stop e.g. an
-- addressee accepting a request while also reassigning requester_id to a
-- different profile. Pin the two party columns explicitly instead.
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

create policy "Either party can view a friendship"
  on public.friendships for select
  to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

create policy "Users can send friend requests"
  on public.friendships for insert
  to authenticated
  with check (requester_id = auth.uid() and status = 'pending');

-- Only the addressee can move a pending request to accepted/declined.
create policy "Addressee can respond to a pending request"
  on public.friendships for update
  to authenticated
  using (addressee_id = auth.uid() and status = 'pending')
  with check (addressee_id = auth.uid() and status in ('accepted', 'declined'));

-- Either party can block a connection at any point, regardless of current status.
create policy "Either party can block a connection"
  on public.friendships for update
  to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid())
  with check (status = 'blocked' and (requester_id = auth.uid() or addressee_id = auth.uid()));

create policy "Either party can remove a connection"
  on public.friendships for delete
  to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());
