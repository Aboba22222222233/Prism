create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid();
$$;

revoke execute on function public.current_user_role() from public;
revoke execute on function public.current_user_role() from anon;
grant execute on function public.current_user_role() to authenticated;

create or replace function public.can_view_profile(target_profile_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    auth.uid() = target_profile_id
    or exists (
      select 1
      from public.class_enrollments ce
      where ce.user_id = target_profile_id
        and public.is_class_teacher(ce.class_id, auth.uid())
    )
    or exists (
      select 1
      from public.class_teacher_memberships viewer
      join public.class_teacher_memberships target
        on target.class_id = viewer.class_id
      where viewer.teacher_id = auth.uid()
        and target.teacher_id = target_profile_id
    );
$$;

revoke execute on function public.can_view_profile(uuid) from public;
revoke execute on function public.can_view_profile(uuid) from anon;
grant execute on function public.can_view_profile(uuid) to authenticated;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Teachers can view class student profiles" on public.profiles;

create policy "Users can view accessible profiles"
on public.profiles
for select
to authenticated
using (public.can_view_profile(id));

drop policy if exists "Teachers can view accessible classes" on public.classes;
drop policy if exists "Students can view enrolled classes" on public.classes;

create policy "Teachers can view accessible classes"
on public.classes
for select
to authenticated
using (
  public.current_user_role() = 'teacher'
  and public.is_class_teacher(id)
);

create policy "Students can view enrolled classes"
on public.classes
for select
to authenticated
using (
  public.current_user_role() = 'student'
  and exists (
    select 1
    from public.class_enrollments ce
    where ce.class_id = classes.id
      and ce.user_id = auth.uid()
  )
);
