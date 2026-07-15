-- Leagues: optional grouping owned by a single profile.
create table public.leagues (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index leagues_owner_id_idx on public.leagues (owner_id);

alter table public.leagues enable row level security;

create policy "Users manage their own leagues"
  on public.leagues for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
