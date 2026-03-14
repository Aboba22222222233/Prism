create or replace function public.join_class_by_code(input_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_class_id uuid;
  v_is_student boolean := false;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select (p.role = 'student')
    into v_is_student
  from public.profiles p
  where p.id = v_user_id;

  if coalesce(v_is_student, false) is false then
    raise exception 'Only students can join classes';
  end if;

  select c.id
    into v_class_id
  from public.classes c
  where c.code = upper(trim(input_code))
  limit 1;

  if v_class_id is null then
    raise exception 'Class not found';
  end if;

  insert into public.class_enrollments (user_id, class_id)
  values (v_user_id, v_class_id)
  on conflict do nothing;

  return v_class_id;
end;
$$;

drop policy if exists "Teachers and students can view accessible classes" on public.classes;
drop policy if exists "Teachers can view accessible classes" on public.classes;
drop policy if exists "Students can view enrolled classes" on public.classes;

create policy "Teachers can view accessible classes"
on public.classes
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'teacher'
  )
  and public.is_class_teacher(id)
);

create policy "Students can view enrolled classes"
on public.classes
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'student'
  )
  and exists (
    select 1
    from public.class_enrollments ce
    where ce.class_id = classes.id
      and ce.user_id = auth.uid()
  )
);
