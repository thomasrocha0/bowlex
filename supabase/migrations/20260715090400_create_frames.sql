-- Frames: 10 per game, storing individual roll/pin data needed to compute scores.
create table public.frames (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  frame_number integer not null check (frame_number between 1 and 10),
  rolls integer[] not null,
  created_at timestamptz not null default now(),
  unique (game_id, frame_number)
);

create index frames_game_id_idx on public.frames (game_id);

alter table public.frames enable row level security;

-- No profile_id column on frames, so ownership is checked via the parent game.
create policy "Users manage frames on their own games"
  on public.frames for all
  to authenticated
  using (
    exists (
      select 1 from public.games g
      where g.id = frames.game_id and g.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.games g
      where g.id = frames.game_id and g.profile_id = auth.uid()
    )
  );
