create or replace function public.ensure_class_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.teacher_id is not null then
    insert into public.class_teacher_memberships (class_id, teacher_id)
    values (new.id, new.teacher_id)
    on conflict (class_id, teacher_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists ensure_class_owner_membership on public.classes;
create trigger ensure_class_owner_membership
after insert on public.classes
for each row
execute function public.ensure_class_owner_membership();

create or replace function public.leave_teacher_class(target_class_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_owner_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select c.teacher_id
    into v_owner_id
  from public.classes c
  where c.id = target_class_id;

  if v_owner_id is null then
    raise exception 'Class not found';
  end if;

  if v_owner_id = v_user_id then
    raise exception 'Owner cannot leave own class';
  end if;

  delete from public.class_teacher_memberships
  where class_id = target_class_id
    and teacher_id = v_user_id;

  return true;
end;
$$;

revoke execute on function public.leave_teacher_class(uuid) from public;
revoke execute on function public.leave_teacher_class(uuid) from anon;
grant execute on function public.leave_teacher_class(uuid) to authenticated;

drop policy if exists "Teachers can remove students from accessible classes" on public.class_enrollments;
create policy "Owners can remove students from their classes"
on public.class_enrollments
for delete
to authenticated
using (
  exists (
    select 1
    from public.classes c
    where c.id = class_enrollments.class_id
      and c.teacher_id = auth.uid()
  )
);

drop policy if exists "Teachers can leave joined classes" on public.class_teacher_memberships;
create policy "Teachers can leave joined classes"
on public.class_teacher_memberships
for delete
to authenticated
using (
  teacher_id = auth.uid()
  and exists (
    select 1
    from public.classes c
    where c.id = class_teacher_memberships.class_id
      and c.teacher_id <> auth.uid()
  )
);

drop policy if exists "Owners can remove teacher memberships from their classes" on public.class_teacher_memberships;
create policy "Owners can remove teacher memberships from their classes"
on public.class_teacher_memberships
for delete
to authenticated
using (
  teacher_id <> auth.uid()
  and exists (
    select 1
    from public.classes c
    where c.id = class_teacher_memberships.class_id
      and c.teacher_id = auth.uid()
  )
);
