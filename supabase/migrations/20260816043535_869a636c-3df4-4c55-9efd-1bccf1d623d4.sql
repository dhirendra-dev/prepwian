ALTER TABLE public.user_daily_targets ADD COLUMN IF NOT EXISTS subject text;

ALTER TABLE public.protected_identities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.protected_identities FROM anon;
GRANT SELECT ON public.protected_identities TO authenticated;
GRANT ALL ON public.protected_identities TO service_role;

DROP POLICY IF EXISTS "protected_identities_select_own" ON public.protected_identities;
CREATE POLICY "protected_identities_select_own" ON public.protected_identities
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "protected_identities_admin_write" ON public.protected_identities;
CREATE POLICY "protected_identities_admin_write" ON public.protected_identities
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));