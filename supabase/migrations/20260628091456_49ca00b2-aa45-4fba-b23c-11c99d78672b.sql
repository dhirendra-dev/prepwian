CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  reg_cert_id uuid;
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student')
    ON CONFLICT DO NOTHING;

  -- Auto-award the Official Member (registration) certificate
  SELECT id INTO reg_cert_id FROM public.certificate_types WHERE code = 'registration' LIMIT 1;
  IF reg_cert_id IS NOT NULL THEN
    INSERT INTO public.user_certificates (user_id, certificate_type_id, verification_code)
    VALUES (
      NEW.id,
      reg_cert_id,
      upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))
    );

    INSERT INTO public.notifications (title, body, link, audience, target_user_id, created_by)
    VALUES (
      '🎓 You earned the Official Member certificate!',
      'Welcome to JEE Prep Hub — view and download your certificate.',
      '/certificates',
      'user',
      NEW.id,
      NEW.id
    );
  END IF;

  RETURN NEW;
END $function$;