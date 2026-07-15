-- Profiles: one row per authenticated user, linked to auth.users.
create extension if not exists pgcrypto;

create type public.stats_visibility as enum ('public', 'friends_only', 'private');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text not null,
  avatar_url text,
  stats_visibility public.stats_visibility not null default 'friends_only',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Username/display name are non-sensitive and need to be readable by any
-- authenticated user so friend search and friendship-embedded joins
-- (useFriends, useFriendRequests) can resolve the other party's profile.
-- Raw game/frame data and computed stats stay locked down separately.
create policy "Profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can create their own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
