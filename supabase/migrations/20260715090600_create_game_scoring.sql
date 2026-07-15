-- Mirrors the lookahead scoring algorithm in src/lib/scoring.ts so game
-- scores are computed on read, not stored redundantly (see CLAUDE.md).
create or replace function public.calculate_game_score(p_rolls integer[])
returns integer
language plpgsql
immutable
as $$
declare
  v_score integer := 0;
  v_roll_index integer := 1; -- Postgres arrays are 1-indexed
  v_frame integer;
begin
  for v_frame in 1..10 loop
    if p_rolls[v_roll_index] = 10 then
      v_score := v_score + 10 + coalesce(p_rolls[v_roll_index + 1], 0) + coalesce(p_rolls[v_roll_index + 2], 0);
      v_roll_index := v_roll_index + 1;
    elsif coalesce(p_rolls[v_roll_index], 0) + coalesce(p_rolls[v_roll_index + 1], 0) = 10 then
      v_score := v_score + 10 + coalesce(p_rolls[v_roll_index + 2], 0);
      v_roll_index := v_roll_index + 2;
    else
      v_score := v_score + coalesce(p_rolls[v_roll_index], 0) + coalesce(p_rolls[v_roll_index + 1], 0);
      v_roll_index := v_roll_index + 2;
    end if;
  end loop;
  return v_score;
end;
$$;

-- security_invoker makes the view evaluate games/frames RLS as the querying
-- user, so this stays safe to expose directly (e.g. for the owner's own
-- stats screen) without leaking other users' scores.
create view public.game_scores
  with (security_invoker = true)
  as
  select
    g.id as game_id,
    g.profile_id,
    g.series_id,
    g.game_number,
    public.calculate_game_score(
      array(
        select unnest(f.rolls)
        from public.frames f
        where f.game_id = g.id
        order by f.frame_number
      )
    ) as score
  from public.games g;

grant select on public.game_scores to authenticated;
