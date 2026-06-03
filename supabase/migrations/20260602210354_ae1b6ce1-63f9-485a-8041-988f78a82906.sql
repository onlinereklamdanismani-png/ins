
-- Fix linter warnings for has_role SECURITY DEFINER function
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;

-- Keep execute for authenticated via RLS policies (policies run as table owner, not invoker)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
