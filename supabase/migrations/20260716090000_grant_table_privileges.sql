-- The `postgres` role's default privileges for schema public (as opposed to
-- supabase_admin's) don't include select/insert/update/delete for anon/
-- authenticated/service_role — only Dxtm (delete/truncate/references/
-- trigger/maintain). Since migrations create tables as `postgres`, every
-- table below was left without the grants its RLS policies assume, causing
-- 403s (42501 permission denied) before RLS is ever evaluated. Mirrors the
-- explicit grant already used for game_scores/get_friend_stats.
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.leagues to authenticated;
grant select, insert, update, delete on public.series to authenticated;
grant select, insert, update, delete on public.games to authenticated;
grant select, insert, update, delete on public.frames to authenticated;
grant select, insert, update, delete on public.friendships to authenticated;
