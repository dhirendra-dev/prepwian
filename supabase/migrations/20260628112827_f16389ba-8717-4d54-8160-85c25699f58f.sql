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
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student')
    ON CONFLICT DO NOTHING;

  SELECT id INTO reg_cert_id FROM public.certificate_types WHERE code = 'registration' LIMIT 1;
  IF reg_cert_id IS NOT NULL THEN
    INSERT INTO public.user_certificates (user_id, certificate_type_id, verification_code)
    VALUES (NEW.id, reg_cert_id, upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)));

    INSERT INTO public.notifications (title, body, link, audience, target_user_id, created_by)
    VALUES (
      '🎓 You earned the Official Member certificate!',
      'Welcome to JEE Prep Hub — view and download your certificate.',
      '/certificates',
      'user', NEW.id, NEW.id
    );
  END IF;

  -- Auto-follow every admin
  INSERT INTO public.follows (follower_id, following_id)
  SELECT NEW.id, ur.user_id
  FROM public.user_roles ur
  WHERE ur.role = 'admin' AND ur.user_id <> NEW.id
  ON CONFLICT DO NOTHING;

  -- Send a welcome DM from an admin account
  SELECT ur.user_id INTO admin_id FROM public.user_roles ur WHERE ur.role = 'admin' ORDER BY ur.created_at ASC LIMIT 1;
  IF admin_id IS NOT NULL AND admin_id <> NEW.id THEN
    welcome_body :=
      '👋 Welcome to JEE Prep Hub!' || E'\n\n' ||
      'We are so glad you joined our community of JEE & NEET aspirants. Here is everything you can do:' || E'\n\n' ||
      '📚 Material Hub — curated Allen, PW & Cengage Drive links for every subject.' || E'\n' ||
      '⏱️ Focus Tools — Pomodoro timer, study stopwatch, streaks & badges.' || E'\n' ||
      '✅ Daily Checklist — set today''s tasks and plan tomorrow.' || E'\n' ||
      '📊 Log Study Hours — track every hour you put in.' || E'\n' ||
      '🏆 Leaderboard & Certificates — climb the ranks and earn shareable PDF certificates.' || E'\n' ||
      '💬 Community Chat — live global chat with all aspirants.' || E'\n' ||
      '📝 Social Feed — share doubts, tips & wins. Like, comment & share.' || E'\n' ||
      '👥 Study Squads — WhatsApp-style group chats with file sharing.' || E'\n' ||
      '📩 Direct Messages — follow friends and chat 1:1.' || E'\n' ||
      '📢 Notice Board & Polls — stay updated on everything important.' || E'\n\n' ||
      '💡 Pro tips:' || E'\n' ||
      '• Complete your profile & add a photo so others can recognise you.' || E'\n' ||
      '• Run a Pomodoro every day to build your streak 🔥' || E'\n' ||
      '• Join the live community chat & say hi!' || E'\n\n' ||
      'Reply to this message anytime if you need help. All the best for your prep! 🚀' || E'\n' ||
      '— JEE Prep Hub Admin';

    INSERT INTO public.direct_messages (sender_id, recipient_id, body)
    VALUES (admin_id, NEW.id, welcome_body);

    INSERT INTO public.notifications (title, body, link, audience, target_user_id, created_by)
    VALUES (
      '📩 Welcome message from JEE Prep Hub Admin',
      'Tap to read your personal welcome guide with all features explained.',
      '/messages/' || admin_id::text,
      'user', NEW.id, admin_id
    );
  END IF;

  RETURN NEW;
END $function$;

-- Backfill: every existing non-admin user follows every admin
INSERT INTO public.follows (follower_id, following_id)
SELECT p.id, ur.user_id
FROM public.profiles p
CROSS JOIN public.user_roles ur
WHERE ur.role = 'admin' AND ur.user_id <> p.id
ON CONFLICT DO NOTHING;