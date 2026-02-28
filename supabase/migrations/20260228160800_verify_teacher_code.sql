CREATE OR REPLACE FUNCTION public.verify_teacher_code(input_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the secret corporate code safely on the backend
  IF input_code = 'Zerde2025' THEN
    -- If the user is currently authenticated (student upgrading their account), update their role
    IF auth.uid() IS NOT NULL THEN
      UPDATE public.profiles SET role = 'teacher' WHERE id = auth.uid();
      -- Also update raw_user_meta_data for complete role synchronization
      UPDATE auth.users 
      SET raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{role}', '"teacher"') 
      WHERE id = auth.uid();
    END IF;
    
    RETURN true;
  END IF;

  RETURN false;
END;
$$;
