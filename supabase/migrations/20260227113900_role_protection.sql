-- Migration: Prevent users from updating their own 'role' to escalate privileges
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER AS $$
BEGIN
  -- If the role is being changed from its existing value by a user update
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Users are not allowed to update their own role via the client.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_role_protection ON public.profiles;
CREATE TRIGGER enforce_role_protection
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();
