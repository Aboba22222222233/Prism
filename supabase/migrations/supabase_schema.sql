-- Safely add 'emotions' column if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'checkins' and column_name = 'emotions') then
    alter table public.checkins add column emotions text[];
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'checkins' and column_name = 'sleep_hours') then
    alter table public.checkins add column sleep_hours float;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'checkins' and column_name = 'energy_level') then
    alter table public.checkins add column energy_level int check (energy_level >= 1 and energy_level <= 10);
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'bio') then
    alter table public.profiles add column bio text;
  end if;
end $$;

-- STORAGE: Avatars Bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage Policies (Drop first to avoid conflicts)
drop policy if exists "Avatar images are publicly accessible." on storage.objects;
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

drop policy if exists "Anyone can upload an avatar." on storage.objects;
create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );

drop policy if exists "Anyone can update an avatar." on storage.objects;
create policy "Anyone can update an avatar."
  on storage.objects for update
  with check ( bucket_id = 'avatars' );

-- Drop existing policies to avoid conflicts when re-running
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Users can insert their own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Students can insert their own checkins" on checkins;
drop policy if exists "Users can view own checkins" on checkins;
drop policy if exists "Teachers can view all checkins" on checkins;
drop policy if exists "Users can delete own checkins" on checkins;

-- Ensure tables exist (IF NOT EXISTS is already there, but good to keep)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  role text check (role in ('teacher', 'student')),
  class_id text, -- storing the UUID of the class as text for simplicity
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

-- Re-create Policies for profiles
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

create table if not exists public.checkins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  mood_score int check (mood_score >= 1 and mood_score <= 5),
  stress_score int check (stress_score >= 0 and stress_score <= 10),
  emotions text[], 
  factors text[], 
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.checkins enable row level security;

-- Re-create Policies for checkins
-- Re-create Policies for checkins
create policy "Students can insert their own checkins"
  on checkins for insert
  with check ( auth.uid() = user_id );

create policy "Users can view own checkins"
  on checkins for select
  using ( auth.uid() = user_id );

create policy "Teachers can view all checkins"
  on checkins for select
  using ( 
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'teacher'
    )
  );

create policy "Users can delete own checkins"
  on checkins for delete
  using ( auth.uid() = user_id );

-- CLASSES TABLE (New)
create table if not exists public.classes (
  id uuid default gen_random_uuid() primary key,
  teacher_id uuid references auth.users not null,
  name text not null,
  code text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.classes enable row level security;

-- Drop existing policies for classes to avoid duplication errors
drop policy if exists "Teachers can view their own classes" on classes;
drop policy if exists "Teachers can insert their own classes" on classes;
drop policy if exists "Public can view classes (needed for joining by code)" on classes;
drop policy if exists "Teachers can update their own classes" on classes;
drop policy if exists "Teachers can delete their own classes" on classes;

create policy "Teachers can view their own classes"
  on classes for select
  using ( auth.uid() = teacher_id );

create policy "Teachers can insert their own classes"
  on classes for insert
  with check ( auth.uid() = teacher_id );

create policy "Teachers can update their own classes"
  on classes for update
  using ( auth.uid() = teacher_id );

create policy "Teachers can delete their own classes"
  on classes for delete
  using ( auth.uid() = teacher_id );

-- Allow anyone (students) to find a class by specific code (for joining)
create policy "Public can view classes (needed for joining by code)"
  on classes for select
  using ( true );

-- MULTI-CLASS UPDATE
create table if not exists public.class_enrollments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  class_id uuid references public.classes(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, class_id)
);

alter table public.class_enrollments enable row level security;

drop policy if exists "Users can view their own enrollments" on class_enrollments;
create policy "Users can view their own enrollments"
  on class_enrollments for select
  using ( auth.uid() = user_id );

drop policy if exists "Users can enroll themselves" on class_enrollments;
create policy "Users can enroll themselves"
  on class_enrollments for insert
  with check ( auth.uid() = user_id );

drop policy if exists "Teachers can view enrollments for their classes" on class_enrollments;
create policy "Teachers can view enrollments for their classes"
  on class_enrollments for select
  using (
    exists (
      select 1 from classes
      where classes.id = class_enrollments.class_id
      and classes.teacher_id = auth.uid()
    )
  );

drop policy if exists "Users can unenroll themselves" on class_enrollments;
create policy "Users can unenroll themselves"
  on class_enrollments for delete
  using ( auth.uid() = user_id );

create policy "Teachers can remove students from their classes"
  on class_enrollments for delete
  using (
    exists (
      select 1 from classes
      where classes.id = class_enrollments.class_id
      and classes.teacher_id = auth.uid()
    )
  );

-- Add class_id to checkins if not exists
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'checkins' and column_name = 'class_id') then
    alter table public.checkins add column class_id uuid references public.classes(id);
  end if;
end $$;

-- TASKS MODULE
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references public.classes(id) on delete cascade not null,
  title text not null,
  description text,
  type text default 'text', -- 'text' or 'boolean'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.tasks enable row level security;

drop policy if exists "Teachers can manage tasks for their classes" on tasks;
create policy "Teachers can manage tasks for their classes"
  on tasks for all
  using (
    exists (
      select 1 from classes
      where classes.id = tasks.class_id
      and classes.teacher_id = auth.uid()
    )
  );

drop policy if exists "Students can view tasks for their enrolled classes" on tasks;
create policy "Students can view tasks for their enrolled classes"
  on tasks for select
  using (
    exists (
      select 1 from class_enrollments
      where class_enrollments.class_id = tasks.class_id
      and class_enrollments.user_id = auth.uid()
    )
  );

create table if not exists public.student_tasks (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  completed boolean default false,
  response text,
  completed_at timestamp with time zone,
  unique(task_id, student_id)
);

alter table public.student_tasks enable row level security;

drop policy if exists "Students can manage their own task submissions" on student_tasks;
create policy "Students can manage their own task submissions"
  on student_tasks for all
  using ( auth.uid() = student_id );

drop policy if exists "Teachers can view student tasks for their classes" on student_tasks;
create policy "Teachers can view student tasks for their classes"
  on student_tasks for select
  using (
    exists (
      select 1 from tasks
      join classes on classes.id = tasks.class_id
      where tasks.id = student_tasks.task_id
      and classes.teacher_id = auth.uid()
    )
  );

-- TRIGGER: Auto-clear profile class_id when enrollment is deleted
create or replace function public.handle_unenrollment()
returns trigger
language plpgsql
security definer
as $$
begin
  -- If the student's current main class_id matches the one being removed, clear it
  update public.profiles
  set class_id = null
  where id = old.user_id and class_id = old.class_id;
  return old;
end;
$$;

drop trigger if exists on_enrollment_deleted on public.class_enrollments;
create trigger on_enrollment_deleted
  after delete on public.class_enrollments

-- EVENTS / CALENDAR MODULE
create table if not exists public.class_events (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references public.classes(id) on delete cascade not null,
  title text not null,
  date timestamp with time zone not null,
  type text not null check (type in ('sor', 'soch', 'control_work', 'homework', 'other')),
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.class_events enable row level security;

drop policy if exists "Teachers can manage events for their classes" on class_events;
create policy "Teachers can manage events for their classes"
  on class_events for all
  using (
    exists (
      select 1 from classes
      where classes.id = class_events.class_id
      and classes.teacher_id = auth.uid()
    )
  );

drop policy if exists "Students can view events for their classes" on class_events;
create policy "Students can view events for their classes"
  on class_events for select
  using (
    exists (
      select 1 from class_enrollments
      where class_enrollments.class_id = class_events.class_id
      and class_enrollments.user_id = auth.uid()
    )
  );
