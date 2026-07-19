-- Server-side mirror of validateFrame() in src/lib/scoring.ts. Client-side
-- validation (CLAUDE.md's "validate frame input client-side before writing")
-- only stops the app's own UI from submitting bad data -- it does nothing
-- against a hand-crafted RPC call or a direct PostgREST insert against
-- public.frames, since `authenticated` has table-level insert/update grants
-- (see 20260716090000_grant_table_privileges.sql) and RLS only checks
-- ownership, not roll validity. This closes that gap at the table level so
-- it's enforced no matter which path writes a row.
--
-- Postgres arrays are 1-indexed (see calculate_game_score for the same note).
create or replace function public.is_valid_frame_rolls(p_frame_number integer, p_rolls integer[])
returns boolean
language plpgsql
immutable
as $$
declare
  v_len integer := coalesce(array_length(p_rolls, 1), 0);
  v_earned_bonus boolean;
begin
  if p_rolls is null or exists (
    select 1 from unnest(p_rolls) r where r is null or r < 0 or r > 10
  ) then
    return false;
  end if;

  if p_frame_number <> 10 then
    if v_len < 1 or v_len > 2 then
      return false;
    end if;
    if v_len = 2 and p_rolls[1] + p_rolls[2] > 10 then
      return false;
    end if;
    if v_len = 1 and p_rolls[1] <> 10 then
      return false;
    end if;
    return true;
  end if;

  -- 10th frame
  if v_len < 2 or v_len > 3 then
    return false;
  end if;
  if p_rolls[1] <> 10 and p_rolls[1] + p_rolls[2] > 10 then
    return false;
  end if;

  v_earned_bonus := p_rolls[1] = 10 or p_rolls[1] + p_rolls[2] = 10;
  if v_len = 3 and not v_earned_bonus then
    return false;
  end if;
  if v_len = 2 and v_earned_bonus then
    return false;
  end if;
  if v_len = 3 and p_rolls[1] = 10 and p_rolls[2] <> 10 and p_rolls[2] + p_rolls[3] > 10 then
    return false;
  end if;

  return true;
end;
$$;

alter table public.frames
  add constraint frames_rolls_valid check (public.is_valid_frame_rolls(frame_number, rolls));

-- Re-check up front inside the RPC too, so the normal app path gets a
-- readable error naming the bad frame instead of a raw 23514 constraint
-- violation. The table constraint above remains the real guard, since it
-- also covers any insert that skips this function entirely.
create or replace function public.create_series_with_games(
  p_bowled_at timestamptz,
  p_games jsonb,
  p_league_id uuid default null
)
returns table (series_id uuid, game_id uuid, game_number integer)
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_series_id uuid;
  v_game_id uuid;
  v_game_number integer := 0;
  v_game jsonb;
  v_frame jsonb;
  v_frame_number integer;
  v_rolls integer[];
begin
  if jsonb_typeof(p_games) is distinct from 'array' or jsonb_array_length(p_games) < 1 then
    raise exception 'p_games must be a non-empty JSON array of games';
  end if;

  if jsonb_array_length(p_games) > 10 then
    raise exception 'A single series can have at most 10 games';
  end if;

  insert into public.series (profile_id, league_id, bowled_at)
  values (auth.uid(), p_league_id, p_bowled_at)
  returning id into v_series_id;

  for v_game in select * from jsonb_array_elements(p_games)
  loop
    v_game_number := v_game_number + 1;

    if jsonb_typeof(v_game) is distinct from 'array' or jsonb_array_length(v_game) <> 10 then
      raise exception 'Game % must have exactly 10 frames', v_game_number;
    end if;

    insert into public.games (series_id, profile_id, game_number)
    values (v_series_id, auth.uid(), v_game_number)
    returning id into v_game_id;

    v_frame_number := 0;
    for v_frame in select * from jsonb_array_elements(v_game)
    loop
      v_frame_number := v_frame_number + 1;

      select array_agg(value::integer order by ordinality)
      into v_rolls
      from jsonb_array_elements_text(v_frame) with ordinality as t(value, ordinality);

      if not public.is_valid_frame_rolls(v_frame_number, v_rolls) then
        raise exception 'Game %, frame % has an invalid combination of rolls', v_game_number, v_frame_number;
      end if;

      insert into public.frames (game_id, frame_number, rolls)
      values (v_game_id, v_frame_number, v_rolls);
    end loop;
  end loop;

  return query
    select v_series_id, g.id, g.game_number
    from public.games g
    where g.series_id = v_series_id
    order by g.game_number;
end;
$$;

revoke all on function public.create_series_with_games(timestamptz, jsonb, uuid) from public;
grant execute on function public.create_series_with_games(timestamptz, jsonb, uuid) to authenticated;
