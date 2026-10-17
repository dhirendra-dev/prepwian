
-- 1) Guest flag on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_guest boolean NOT NULL DEFAULT false;

-- 2) Update handle_new_user to detect anonymous (guest) sign-ins and skip
--    heavy welcome flows for guests (no cert / welcome DMs / auto-follows)
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  reg_cert_id uuid;
  admin_id uuid;
  welcome_body text;
  thanks_body text;
  is_guest_user boolean := COALESCE(NEW.is_anonymous, false);
  guest_seq int;
  guest_name text;
BEGIN
  IF is_guest_user THEN
    SELECT COUNT(*) + 1 INTO guest_seq FROM public.profiles WHERE is_guest = true;
    guest_name := 'Guest User ' || guest_seq;
    INSERT INTO public.profiles (id, full_name, avatar_url, is_guest)
    VALUES (NEW.id, guest_name, NULL, true);
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student') ON CONFLICT DO NOTHING;
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student') ON CONFLICT DO NOTHING;

  SELECT id INTO reg_cert_id FROM public.certificate_types WHERE code = 'registration' LIMIT 1;
  IF reg_cert_id IS NOT NULL THEN
    INSERT INTO public.user_certificates (user_id, certificate_type_id, verification_code)
    VALUES (NEW.id, reg_cert_id, upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)));
    INSERT INTO public.notifications (title, body, link, audience, target_user_id, created_by)
    VALUES ('🎓 You earned the Official Member certificate!',
      'Welcome to JEE Prep Hub — view and download your certificate.',
      '/certificates', 'user', NEW.id, NEW.id);
  END IF;

  INSERT INTO public.follows (follower_id, following_id)
  SELECT NEW.id, ur.user_id FROM public.user_roles ur
  WHERE ur.role = 'admin' AND ur.user_id <> NEW.id
  ON CONFLICT DO NOTHING;

  INSERT INTO public.study_group_members (group_id, user_id, role)
  SELECT sg.id, NEW.id, 'member' FROM public.study_groups sg
  ON CONFLICT DO NOTHING;

  INSERT INTO public.notifications (title, body, link, audience, target_user_id, created_by)
  VALUES ('👥 You have been added to all study squads',
    'Open Study Squads to chat with everyone, share files & collaborate.',
    '/groups', 'user', NEW.id, NEW.id);

  SELECT ur.user_id INTO admin_id FROM public.user_roles ur WHERE ur.role = 'admin' ORDER BY ur.created_at ASC LIMIT 1;
  IF admin_id IS NOT NULL AND admin_id <> NEW.id THEN
    welcome_body := '👋 Welcome to JEE Prep Hub! Explore materials, timer, squads and more. — Admin';
    INSERT INTO public.direct_messages (sender_id, recipient_id, body) VALUES (admin_id, NEW.id, welcome_body);
  END IF;

  RETURN NEW;
END $function$;

-- 3) Consent settings (singleton) — admin controls which sections are required
CREATE TABLE IF NOT EXISTS public.consent_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  require_device boolean NOT NULL DEFAULT true,
  require_network boolean NOT NULL DEFAULT true,
  require_gps boolean NOT NULL DEFAULT true,
  require_personal_details boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.consent_settings TO authenticated, anon;
GRANT ALL ON public.consent_settings TO service_role;

ALTER TABLE public.consent_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consent_settings_public_read" ON public.consent_settings;
CREATE POLICY "consent_settings_public_read" ON public.consent_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "consent_settings_admin_write" ON public.consent_settings;
CREATE POLICY "consent_settings_admin_write" ON public.consent_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.consent_settings (id, require_device, require_network, require_gps, require_personal_details)
VALUES (1, true, true, true, false)
ON CONFLICT (id) DO NOTHING;
