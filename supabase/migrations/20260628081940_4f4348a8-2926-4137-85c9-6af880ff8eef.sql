REVOKE INSERT ON public.audit_logs FROM authenticated;
DROP POLICY IF EXISTS "Authenticated can insert own audit entries" ON public.audit_logs;