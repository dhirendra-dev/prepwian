
-- 1. Admin-only consent decryption RPC
CREATE OR REPLACE FUNCTION public.admin_get_consents_decrypted()
RETURNS TABLE(id uuid, user_id uuid, consented_at timestamp with time zone, purpose text, user_agent text, platform text, os text, browser text, language text, timezone text, screen_size text, device_pixel_ratio numeric, ip_address text, ip_city text, ip_region text, ip_country text, ip_isp text, gps_latitude numeric, gps_longitude numeric, gps_accuracy numeric, full_name text, phone text, dob date, address_line text, city text, state text, pincode text, school text, class_level text, parent_name text, parent_phone text, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE k text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  k := current_setting('app.consent_key', true);
  RETURN QUERY
    SELECT c.id, c.user_id, c.consented_at, c.purpose, c.user_agent, c.platform, c.os, c.browser,
           c.language, c.timezone, c.screen_size, c.device_pixel_ratio,
           public._jph_safe_decrypt(c.ip_address, k), c.ip_city, c.ip_region, c.ip_country, c.ip_isp,
           c.gps_latitude, c.gps_longitude, c.gps_accuracy,
           public._jph_safe_decrypt(c.full_name, k), public._jph_safe_decrypt(c.phone, k), c.dob,
           public._jph_safe_decrypt(c.address_line, k), c.city, c.state, c.pincode, c.school, c.class_level,
           public._jph_safe_decrypt(c.parent_name, k), public._jph_safe_decrypt(c.parent_phone, k),
           c.created_at, c.updated_at
    FROM public.user_consents c;
END;
$fn$;

REVOKE ALL ON FUNCTION public.admin_get_consents_decrypted() FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_consents_decrypted() TO service_role;

-- 2. Trigger-only SECURITY DEFINER functions must not be directly callable
DO $do$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
      AND pg_get_function_result(p.oid) = 'trigger'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, authenticated, PUBLIC', r.sig);
  END LOOP;
END
$do$;

-- 3. Explicit admin-only policies on secret-bearing tables (no anon/authenticated grants exist)
DROP POLICY IF EXISTS "Admins manage ai generation settings" ON public.ai_generation_settings;
CREATE POLICY "Admins manage ai generation settings"
  ON public.ai_generation_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Service role manages ai generation settings" ON public.ai_generation_settings;
CREATE POLICY "Service role manages ai generation settings"
  ON public.ai_generation_settings FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage material gate" ON public.material_gate;
CREATE POLICY "Admins manage material gate"
  ON public.material_gate FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Service role manages material gate" ON public.material_gate;
CREATE POLICY "Service role manages material gate"
  ON public.material_gate FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 4. Scope consent self-management to signed-in users only
DROP POLICY IF EXISTS "Users manage their own consent" ON public.user_consents;
CREATE POLICY "Users manage their own consent"
  ON public.user_consents FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
