-- Security-definer function: the single trust-boundary check for reading
-- another profile's aggregated stats. Raw games/frames stay owner-only per
-- RLS; this function bypasses that deliberately, after verifying the caller
-- is either the owner, or an accepted friend (or public visibility).
create or replace function public.get_friend_stats(target_profile_id uuid)
returns table (
  average numeric,
  high_game integer,
  high_series integer,
  strike_percentage numeric,
  spare_percentage numeric,
  open_frame_percentage numeric
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_visibility public.stats_visibility;
  v_allowed boolean := false;
begin
  if target_profile_id = auth.uid() then
    v_allowed := true;
  else
    select stats_visibility into v_visibility
    from public.profiles
    where id = target_profile_id;

    if v_visibility = 'public' then
      v_allowed := true;
    elsif v_visibility = 'friends_only' then
      select exists (
        select 1
        from public.friendships f
        where f.status = 'accepted'
          and (
            (f.requester_id = auth.uid() and f.addressee_id = target_profile_id)
            or (f.addressee_id = auth.uid() and f.requester_id = target_profile_id)
          )
      ) into v_allowed;
    end if;
    -- v_visibility = 'private' (or profile not found) leaves v_allowed false.
  end if;

  if not v_allowed then
    return;
  end if;

  return query
  select
    (select round(avg(score), 1) from public.game_scores where profile_id = target_profile_id),
    (select max(score) from public.game_scores where profile_id = target_profile_id),
    (
      select max(series_score)
      from (
        select sum(score) as series_score
        from public.game_scores
        where profile_id = target_profile_id
        group by series_id
      ) series_totals
    ),
    (
      select round(100.0 * count(*) filter (where f.rolls[1] = 10) / nullif(count(*), 0), 1)
      from public.frames f
      join public.games g on g.id = f.game_id
      where g.profile_id = target_profile_id
    ),
    (
      select round(100.0 * count(*) filter (
        where f.rolls[1] is distinct from 10
          and coalesce(f.rolls[1], 0) + coalesce(f.rolls[2], 0) = 10
      ) / nullif(count(*), 0), 1)
      from public.frames f
      join public.games g on g.id = f.game_id
      where g.profile_id = target_profile_id
    ),
    (
      select round(100.0 * count(*) filter (
        where f.rolls[1] is distinct from 10
          and coalesce(f.rolls[1], 0) + coalesce(f.rolls[2], 0) is distinct from 10
      ) / nullif(count(*), 0), 1)
      from public.frames f
      join public.games g on g.id = f.game_id
      where g.profile_id = target_profile_id
    );
end;
$$;

revoke all on function public.get_friend_stats(uuid) from public;
grant execute on function public.get_friend_stats(uuid) to authenticated;
