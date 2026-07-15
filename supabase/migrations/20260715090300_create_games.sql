-- Games: one game, belongs to a series and a profile.
create table public.games (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.series (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  game_number integer not null check (game_number > 0),
  created_at timestamptz not null default now(),
  unique (series_id, game_number)
);

create index games_series_id_idx on public.games (series_id);
create index games_profile_id_idx on public.games (profile_id);

alter table public.games enable row level security;

-- with check also verifies the referenced series belongs to the same
-- profile, so a game can't be attached to someone else's series.
create policy "Users manage their own games"
  on public.games for all
  to authenticated
  using (profile_id = auth.uid())
  with check (
    profile_id = auth.uid()
    and exists (
      select 1 from public.series s
      where s.id = games.series_id and s.profile_id = auth.uid()
    )
  );
