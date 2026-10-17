DROP POLICY IF EXISTS "ai settings readable" ON public.community_ai_settings;
CREATE POLICY "community_ai_settings_admin_read" ON public.community_ai_settings
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
REVOKE SELECT ON public.community_ai_settings FROM anon;