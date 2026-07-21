-- Blocks: a one-directional relationship where the blocker hides the
-- blocked user from their own view of profiles/friendships. Kept as its own
-- table (rather than a status on friendships) since a block is not a kind
-- of friendship -- it has no reciprocal acknowledgement step and needs to
-- coexist independently of whatever friendship/request state (if any)
-- already exists between the two users.
create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (blocker_id <> blocked_id),
  unique (blocker_id, blocked_id)
);

create index blocks_blocker_id_idx on public.blocks (blocker_id);
create index blocks_blocked_id_idx on public.blocks (blocked_id);

alter table public.blocks enable row level security;

-- The blocked party gets no policy at all here -- not even to confirm a
-- block exists -- consistent with them also losing visibility of the
-- blocker's profile (see the profiles policy below) and of any friendship
-- row between the two (see create_friendships.sql).
create policy "Blocker can view their own blocks"
  on public.blocks for select
  to authenticated
  using (blocker_id = auth.uid());

create policy "Users can block other users"
  on public.blocks for insert
  to authenticated
  with check (blocker_id = auth.uid());

-- Only the blocker can undo a block.
create policy "Only the blocker can remove a block"
  on public.blocks for delete
  to authenticated
  using (blocker_id = auth.uid());

grant select, insert, delete on public.blocks to authenticated;

-- security definer so this check can see block rows the *caller* has no
-- SELECT access to -- e.g. when p_viewer_id is the blocked party, their own
-- "Blocker can view their own blocks" policy wouldn't let them see rows
-- where they're the target. Only ever used inside a `using` clause below
-- (and in create_friendships.sql) to silently filter rows -- its boolean
-- result must never surface as a distinct error/response to the caller, or
-- it becomes a way for a blocked user to confirm they've been blocked.
create or replace function public.is_blocked_by(p_blocker_id uuid, p_viewer_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.blocks
    where blocker_id = p_blocker_id and blocked_id = p_viewer_id
  );
$$;

revoke all on function public.is_blocked_by(uuid, uuid) from public;
grant execute on function public.is_blocked_by(uuid, uuid) to authenticated;

-- Narrows the "Profiles are readable by authenticated users" policy from
-- 20260715090000_create_profiles.sql: a blocker's profile becomes invisible
-- to whoever they blocked (search included, since search reads this same
-- table). One-directional -- the blocker still sees the blocked party
-- normally, since they need to be able to find them again to unblock. Lives
-- here rather than in create_profiles.sql because it has to run after
-- public.blocks (and is_blocked_by) exist.
alter policy "Profiles are readable by authenticated users"
  on public.profiles
  using (id = auth.uid() or not public.is_blocked_by(profiles.id, auth.uid()));
