-- Create Events Table
create table if not exists public.class_events (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references public.classes(id) on delete cascade not null,
  title text not null,
  date timestamp with time zone not null,
  type text not null check (type in ('sor', 'soch', 'control_work', 'homework', 'other')),
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.class_events enable row level security;

-- Policies
create policy "Teachers can manage events for their classes"
  on class_events for all
  using (
    exists (
      select 1 from classes
      where classes.id = class_events.class_id
      and classes.teacher_id = auth.uid()
    )
  );

create policy "Students can view events for their classes"
  on class_events for select
  using (
    exists (
      select 1 from class_enrollments
      where class_enrollments.class_id = class_events.class_id
      and class_enrollments.user_id = auth.uid()
    )
  );
