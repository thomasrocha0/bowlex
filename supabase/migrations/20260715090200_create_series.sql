-- Series: a set of games bowled in one session, optionally tied to a league.
create table public.series (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  league_id uuid references public.leagues (id) on delete set null,
  bowled_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index series_profile_id_idx on public.series (profile_id);
create index series_league_id_idx on public.series (league_id);

alter table public.series enable row level security;

create policy "Users manage their own series"
  on public.series for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
