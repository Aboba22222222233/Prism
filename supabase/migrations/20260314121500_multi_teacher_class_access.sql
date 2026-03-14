create table if not exists public.class_teacher_memberships (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (class_id, teacher_id)
);

alter table public.class_teacher_memberships enable row level security;

create index if not exists class_teacher_memberships_class_id_idx
  on public.class_teacher_memberships (class_id);

create index if not exists class_teacher_memberships_teacher_id_idx
  on public.class_teacher_memberships (teacher_id);

insert into public.class_teacher_memberships (class_id, teacher_id)
select c.id, c.teacher_id
from public.classes c
where c.teacher_id is not null
on conflict (class_id, teacher_id) do nothing;

create or replace function public.is_class_teacher(target_class_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.classes c
    where c.id = target_class_id
      and c.teacher_id = target_user_id
    union all
    select 1
    from public.class_teacher_memberships m
    where m.class_id = target_class_id
      and m.teacher_id = target_user_id
  );
$$;

revoke execute on function public.is_class_teacher(uuid, uuid) from public;
revoke execute on function public.is_class_teacher(uuid, uuid) from anon;
grant execute on function public.is_class_teacher(uuid, uuid) to authenticated;

create or replace function public.join_teacher_class_by_code(input_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_class_id uuid;
  v_is_teacher boolean := false;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select (p.role = 'teacher')
    into v_is_teacher
  from public.profiles p
  where p.id = v_user_id;

  if coalesce(v_is_teacher, false) is false then
    raise exception 'Only teachers can join classes';
  end if;

  select c.id
    into v_class_id
  from public.classes c
  where c.code = upper(trim(input_code))
  limit 1;

  if v_class_id is null then
    raise exception 'Class not found';
  end if;

  if public.is_class_teacher(v_class_id, v_user_id) then
    return v_class_id;
  end if;

  insert into public.class_teacher_memberships (class_id, teacher_id)
  values (v_class_id, v_user_id)
  on conflict (class_id, teacher_id) do nothing;

  return v_class_id;
end;
$$;

revoke execute on function public.join_teacher_class_by_code(text) from public;
revoke execute on function public.join_teacher_class_by_code(text) from anon;
grant execute on function public.join_teacher_class_by_code(text) to authenticated;

drop policy if exists "Teachers can view memberships for accessible classes" on public.class_teacher_memberships;
create policy "Teachers can view memberships for accessible classes"
on public.class_teacher_memberships
for select
to authenticated
using (public.is_class_teacher(class_id));

drop policy if exists "Teachers and students can view accessible classes" on public.classes;
drop policy if exists "Teachers can view their own classes" on public.classes;
drop policy if exists "Students can view enrolled classes" on public.classes;
create policy "Teachers and students can view accessible classes"
on public.classes
for select
to authenticated
using (
  public.is_class_teacher(id)
  or exists (
    select 1
    from public.class_enrollments ce
    where ce.class_id = classes.id
      and ce.user_id = auth.uid()
  )
);

drop policy if exists "Teacher full view checkins" on public.checkins;
create policy "Teachers can view checkins for accessible classes"
on public.checkins
for select
to authenticated
using (public.is_class_teacher(class_id));

drop policy if exists "Teachers can delete checkins for their classes" on public.checkins;
create policy "Teachers can delete checkins for accessible classes"
on public.checkins
for delete
to authenticated
using (public.is_class_teacher(class_id));

drop policy if exists "Teacher view enrollments" on public.class_enrollments;
drop policy if exists "Teachers can view enrollments for their classes" on public.class_enrollments;
create policy "Teachers can view enrollments for accessible classes"
on public.class_enrollments
for select
to authenticated
using (public.is_class_teacher(class_id));

drop policy if exists "Teachers can remove students from their classes" on public.class_enrollments;
create policy "Teachers can remove students from accessible classes"
on public.class_enrollments
for delete
to authenticated
using (public.is_class_teacher(class_id));

drop policy if exists "Teachers can manage events for their classes" on public.class_events;
create policy "Teachers can manage events for accessible classes"
on public.class_events
for all
to authenticated
using (public.is_class_teacher(class_id))
with check (public.is_class_teacher(class_id));

drop policy if exists "Teachers can manage insights for their classes" on public.class_insights;
create policy "Teachers can manage insights for accessible classes"
on public.class_insights
for all
to authenticated
using (public.is_class_teacher(class_id))
with check (public.is_class_teacher(class_id));

drop policy if exists "Teachers can manage assessments for their classes" on public.ai_risk_assessments;
create policy "Teachers can manage assessments for accessible classes"
on public.ai_risk_assessments
for all
to authenticated
using (public.is_class_teacher(class_id))
with check (public.is_class_teacher(class_id));

drop policy if exists "Teacher view tasks" on public.tasks;
create policy "Teachers can view tasks for accessible classes"
on public.tasks
for select
to authenticated
using (public.is_class_teacher(class_id));

drop policy if exists "Teachers can manage tasks for their classes" on public.tasks;
create policy "Teachers can manage tasks for accessible classes"
on public.tasks
for all
to authenticated
using (public.is_class_teacher(class_id))
with check (public.is_class_teacher(class_id));

drop policy if exists "Teachers can view student tasks for their classes" on public.student_tasks;
create policy "Teachers can view student tasks for accessible classes"
on public.student_tasks
for select
to authenticated
using (
  exists (
    select 1
    from public.tasks t
    where t.id = student_tasks.task_id
      and public.is_class_teacher(t.class_id)
  )
);
