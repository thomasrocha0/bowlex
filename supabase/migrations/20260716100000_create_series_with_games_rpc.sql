-- Atomically creates one series and all its games+frames in a single
-- transaction, so a mid-loop failure can't leave an orphaned game with no
-- frames (frames have no value-level check constraints because bowling-rule
-- validation is deliberately client-side only, per CLAUDE.md).
--
-- SECURITY INVOKER (the default -- no `security definer` here) is
-- intentional: every insert below is a row the calling user already owns,
-- so the existing RLS policies on series/games/frames are sufficient and
-- correct as-is; there is no trust boundary to cross here (contrast with
-- get_friend_stats, which deliberately reads another user's data).
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
