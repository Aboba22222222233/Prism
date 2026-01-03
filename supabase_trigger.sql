-- TRIGGER FOR AUTOMATIC PROFILE CREATION
-- This fixes the issue where profiles aren't created if email confirmation is enabled (no session).

-- 1. Create the function
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, class_id)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'student'), -- Default to student if missing
    case 
      when (new.raw_user_meta_data ->> 'role') = 'student' then '9A' -- Dummy class for students
      else null 
    end
  );
  return new;
end;
$$;

-- 2. Create the trigger
-- Drop first to avoid duplicates if re-running
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
