-- Local dev seed data: one test account with two completed games, each with
-- a mix of strikes, spares, and open frames (not just gutter balls) so the
-- Stats screen has real variation to render.
--
-- Sign in with username "testbowler" / password "password123".
--
-- auth.users/auth.identities are populated by hand (rather than through the
-- app's sign-up flow) because this file only runs against Postgres directly
-- during `supabase db reset` — the handle_new_user trigger on auth.users
-- still fires, so the public.profiles row is created the same way it would
-- be for a real sign-up.
do $$
declare
  v_user_id uuid := '00000000-0000-0000-0000-000000000001';
  v_email text := 'testbowler@users.bowling-tracker.invalid';
  v_series_id uuid;
  v_game_id uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    extensions.crypt('password123', extensions.gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object(
      'username', 'testbowler',
      'email', v_email,
      'email_verified', true,
      'phone_verified', false
    ),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  insert into auth.identities (
    id, provider_id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(),
    v_user_id::text,
    v_user_id,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', v_email,
      'username', 'testbowler',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now(),
    now(),
    now()
  );

  insert into public.series (profile_id, bowled_at)
  values (v_user_id, now())
  returning id into v_series_id;

  -- Game 1: strikes, a spare, open frames, and a strike + bonus in the 10th.
  insert into public.games (series_id, profile_id, game_number)
  values (v_series_id, v_user_id, 1)
  returning id into v_game_id;

  insert into public.frames (game_id, frame_number, rolls) values
    (v_game_id, 1, array[10]),
    (v_game_id, 2, array[7, 2]),
    (v_game_id, 3, array[5, 5]),
    (v_game_id, 4, array[10]),
    (v_game_id, 5, array[9, 0]),
    (v_game_id, 6, array[6, 3]),
    (v_game_id, 7, array[10]),
    (v_game_id, 8, array[8, 1]),
    (v_game_id, 9, array[4, 6]),
    (v_game_id, 10, array[10, 7, 2]);

  -- Game 2: mostly open frames with a couple of spares and one strike.
  insert into public.games (series_id, profile_id, game_number)
  values (v_series_id, v_user_id, 2)
  returning id into v_game_id;

  insert into public.frames (game_id, frame_number, rolls) values
    (v_game_id, 1, array[6, 2]),
    (v_game_id, 2, array[8, 2]),
    (v_game_id, 3, array[3, 4]),
    (v_game_id, 4, array[10]),
    (v_game_id, 5, array[5, 3]),
    (v_game_id, 6, array[7, 1]),
    (v_game_id, 7, array[9, 1]),
    (v_game_id, 8, array[6, 2]),
    (v_game_id, 9, array[8, 0]),
    (v_game_id, 10, array[7, 3, 5]);
end $$;
