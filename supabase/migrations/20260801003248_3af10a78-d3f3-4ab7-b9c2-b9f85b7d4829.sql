-- 1) Revoke EXECUTE from PUBLIC/anon on every SECURITY DEFINER function in public schema
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', f.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', f.sig);
  END LOOP;
END $$;

-- 2) Remove unnecessary signed-in EXECUTE grants (used only inside other definer functions)
REVOKE ALL ON FUNCTION public.is_pro(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.is_user_active(uuid) FROM authenticated;

-- 3) user_security_events: exclude guest (anonymous) sessions
DROP POLICY IF EXISTS "users read own events" ON public.user_security_events;
CREATE POLICY "users read own events" ON public.user_security_events
FOR SELECT TO authenticated
USING (
  COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  AND (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
);

DROP POLICY IF EXISTS "users insert own events" ON public.user_security_events;
CREATE POLICY "users insert own events" ON public.user_security_events
FOR INSERT TO authenticated
WITH CHECK (
  COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  AND auth.uid() = user_id
);