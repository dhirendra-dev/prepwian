DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Authenticated users can view roles for badge display"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.list_admin_ids()
RETURNS TABLE(user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.user_id
  FROM public.user_roles ur
  WHERE ur.role = 'admin';
$$;

GRANT EXECUTE ON FUNCTION public.list_admin_ids() TO anon;
GRANT EXECUTE ON FUNCTION public.list_admin_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_admin_ids() TO service_role;