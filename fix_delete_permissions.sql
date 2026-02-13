-- Этот файл нужно выполнить в Supabase SQL Editor, чтобы разрешить учителю удалять данные класса.

-- 1. Удаляем старое ограничение checkins (если оно есть) и добавляем новое с каскадным удалением
DO $$ 
BEGIN
  -- Пытаемся удалить ограничение, если оно называется checkins_class_id_fkey
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'checkins_class_id_fkey') THEN
    ALTER TABLE IF EXISTS public.checkins DROP CONSTRAINT checkins_class_id_fkey;
  END IF;
END $$;

-- Добавляем ограничение с каскадным удалением (теперь при удалении класса чекины удалятся сами)
ALTER TABLE IF EXISTS public.checkins 
ADD CONSTRAINT checkins_class_id_fkey 
FOREIGN KEY (class_id) 
REFERENCES public.classes(id) 
ON DELETE CASCADE;

-- 2. Разрешаем учителю удалять checkins (на случай ручного удаления)
DROP POLICY IF EXISTS "Teachers can delete checkins for their classes" ON public.checkins;
CREATE POLICY "Teachers can delete checkins for their classes"
  ON public.checkins FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = checkins.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- 3. То же самое для ai_risk_assessments (если таблица есть)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'ai_risk_assessments') THEN
    DROP POLICY IF EXISTS "Teachers can delete risk assessments for their classes" ON public.ai_risk_assessments;
    CREATE POLICY "Teachers can delete risk assessments for their classes"
      ON public.ai_risk_assessments FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.classes
          WHERE classes.id = ai_risk_assessments.class_id
          AND classes.teacher_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 4. То же самое для class_insights (если таблица есть)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'class_insights') THEN
    DROP POLICY IF EXISTS "Teachers can delete insights for their classes" ON public.class_insights;
    CREATE POLICY "Teachers can delete insights for their classes"
      ON public.class_insights FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.classes
          WHERE classes.id = class_insights.class_id
          AND classes.teacher_id = auth.uid()
        )
      );
  END IF;
END $$;
