-- Auto-creates a profiles row when a new auth.users row is inserted, using
-- metadata passed at sign-up time (see usernameToAuthEmail / useSignUp).
-- Runs in the same transaction as the auth.users insert, so sign-up can't
-- succeed with a missing profile, and a duplicate username rolls the whole
-- sign-up back (surfaced to the client as a signUp error).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'username'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
