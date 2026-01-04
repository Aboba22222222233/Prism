-- Исправление ошибки "operator does not exist: text = uuid"
-- Проблема: В таблице profiles поле class_id текстовое, а в триггере оно сравнивается с UUID без преобразования.

create or replace function public.handle_unenrollment()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Добавлено ::text для преобразования UUID в текст
  update public.profiles
  set class_id = null
  where id = old.user_id and class_id = old.class_id::text;
  return old;
end;
$$;
