-- ============ 1. COMMUNITIES ============
CREATE TABLE public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tagline text,
  announcement text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communities TO authenticated;
GRANT ALL ON public.communities TO service_role;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "communities_read" ON public.communities FOR SELECT TO authenticated USING (true);
CREATE POLICY "communities_admin_insert" ON public.communities FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "communities_admin_update" ON public.communities FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "communities_admin_delete" ON public.communities FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER communities_touch BEFORE UPDATE ON public.communities FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ 2. RENAME SQUADS -> GROUPS ============
ALTER TABLE public.study_groups RENAME TO groups;
ALTER TABLE public.study_group_members RENAME TO group_members;

CREATE TYPE public.group_category AS ENUM ('subject','goal','social','batch');
CREATE TYPE public.group_privacy AS ENUM ('open','request');
CREATE TYPE public.group_message_kind AS ENUM ('text','system');

ALTER TABLE public.groups
  ADD COLUMN community_id uuid REFERENCES public.communities(id) ON DELETE CASCADE,
  ADD COLUMN category public.group_category NOT NULL DEFAULT 'subject',
  ADD COLUMN privacy public.group_privacy NOT NULL DEFAULT 'open',
  ADD COLUMN invite_slug text,
  ADD COLUMN created_by uuid;

UPDATE public.groups SET invite_slug = invite_code, created_by = owner_id;

-- starter community so pre-existing groups keep a home
INSERT INTO public.communities (name, tagline, created_by)
SELECT 'JEE Prep Hub', 'Complete JEE & NEET aspirants community',
       (SELECT user_id FROM public.user_roles WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1)
WHERE EXISTS (SELECT 1 FROM public.groups);

UPDATE public.groups g
   SET community_id = (SELECT id FROM public.communities ORDER BY created_at ASC LIMIT 1)
 WHERE g.community_id IS NULL;

ALTER TABLE public.groups ADD CONSTRAINT groups_invite_slug_key UNIQUE (invite_slug);
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS id uuid NOT NULL DEFAULT gen_random_uuid();

-- ============ 3. GROUP SETTINGS ============
CREATE TYPE public.group_permission AS ENUM ('everyone','admins');
CREATE TABLE public.group_settings (
  group_id uuid PRIMARY KEY REFERENCES public.groups(id) ON DELETE CASCADE,
  disappearing_messages boolean NOT NULL DEFAULT false,
  disappearing_days integer NOT NULL DEFAULT 7,
  who_can_send public.group_permission NOT NULL DEFAULT 'everyone',
  who_can_edit public.group_permission NOT NULL DEFAULT 'admins',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_settings TO authenticated;
GRANT ALL ON public.group_settings TO service_role;
ALTER TABLE public.group_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "group_settings_read" ON public.group_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "group_settings_admin_write" ON public.group_settings FOR INSERT TO authenticated
  WITH CHECK (public.is_squad_admin(group_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "group_settings_admin_update" ON public.group_settings FOR UPDATE TO authenticated
  USING (public.is_squad_admin(group_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_squad_admin(group_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER group_settings_touch BEFORE UPDATE ON public.group_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.group_settings (group_id) SELECT id FROM public.groups ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.ensure_group_settings()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.group_settings (group_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.ensure_group_settings() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_ensure_group_settings AFTER INSERT ON public.groups FOR EACH ROW EXECUTE FUNCTION public.ensure_group_settings();

-- ============ 4. GROUP REPORTS ============
CREATE TABLE public.group_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  reported_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.group_reports TO authenticated;
GRANT ALL ON public.group_reports TO service_role;
ALTER TABLE public.group_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "group_reports_insert_own" ON public.group_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reported_by AND NOT public.is_guest_session());
CREATE POLICY "group_reports_admin_read" ON public.group_reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = reported_by);

-- ============ 5. SAHAI MESSAGES ============
CREATE TABLE public.sahai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sahai_messages_user_idx ON public.sahai_messages (user_id, created_at);
GRANT SELECT, INSERT, DELETE ON public.sahai_messages TO authenticated;
GRANT ALL ON public.sahai_messages TO service_role;
ALTER TABLE public.sahai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sahai_own_read" ON public.sahai_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "sahai_own_insert" ON public.sahai_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND NOT public.is_guest_session());
CREATE POLICY "sahai_own_delete" ON public.sahai_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ 6. SYSTEM MESSAGES ============
ALTER TABLE public.study_group_messages ADD COLUMN type public.group_message_kind NOT NULL DEFAULT 'text';

CREATE OR REPLACE FUNCTION public.group_system_message_on_join()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE who text; gname text;
BEGIN
  SELECT COALESCE(full_name, 'A student') INTO who FROM public.profiles WHERE id = NEW.user_id;
  SELECT name INTO gname FROM public.groups WHERE id = NEW.group_id;
  IF NEW.role = 'owner' THEN
    INSERT INTO public.study_group_messages (group_id, user_id, body, type)
    VALUES (NEW.group_id, NEW.user_id, who || ' created "' || COALESCE(gname,'this group') || '"', 'system');
  ELSE
    INSERT INTO public.study_group_messages (group_id, user_id, body, type)
    VALUES (NEW.group_id, NEW.user_id, who || ' joined using this group''s invite link', 'system');
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.group_system_message_on_join() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_group_system_join AFTER INSERT ON public.group_members FOR EACH ROW EXECUTE FUNCTION public.group_system_message_on_join();

CREATE OR REPLACE FUNCTION public.group_system_message_on_leave()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE who text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE id = OLD.group_id) THEN RETURN OLD; END IF;
  SELECT COALESCE(full_name, 'A student') INTO who FROM public.profiles WHERE id = OLD.user_id;
  INSERT INTO public.study_group_messages (group_id, user_id, body, type)
  VALUES (OLD.group_id, OLD.user_id, who || ' left', 'system');
  RETURN OLD;
END $$;
REVOKE EXECUTE ON FUNCTION public.group_system_message_on_leave() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_group_system_leave AFTER DELETE ON public.group_members FOR EACH ROW EXECUTE FUNCTION public.group_system_message_on_leave();

-- enforce who_can_send
CREATE OR REPLACE FUNCTION public.enforce_group_send_permission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE perm public.group_permission;
BEGIN
  IF NEW.type = 'system' THEN RETURN NEW; END IF;
  SELECT who_can_send INTO perm FROM public.group_settings WHERE group_id = NEW.group_id;
  IF perm = 'admins'
     AND NOT public.is_squad_admin(NEW.group_id, NEW.user_id)
     AND NOT public.has_role(NEW.user_id, 'admin') THEN
    RAISE EXCEPTION 'Only admins can send messages in this group';
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.enforce_group_send_permission() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_enforce_group_send BEFORE INSERT ON public.study_group_messages FOR EACH ROW EXECUTE FUNCTION public.enforce_group_send_permission();

-- ============ 7. RECREATE FUNCTIONS THAT REFERENCE RENAMED TABLES ============
CREATE OR REPLACE FUNCTION public.is_squad_admin(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group_id AND user_id = _user_id AND role IN ('admin','owner')
  ) OR EXISTS (
    SELECT 1 FROM public.groups WHERE id = _group_id AND owner_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.gen_squad_invite_code()
RETURNS text LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE code TEXT; chars TEXT := 'abcdefghijkmnpqrstuvwxyz23456789'; i INT;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..10 LOOP
      code := code || substr(chars, 1 + floor(random()*length(chars))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.groups WHERE invite_code = code OR invite_slug = code);
  END LOOP;
  RETURN code;
END $$;

CREATE OR REPLACE FUNCTION public.ensure_squad_invite_code()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := public.gen_squad_invite_code();
  END IF;
  IF NEW.invite_slug IS NULL OR NEW.invite_slug = '' THEN
    NEW.invite_slug := NEW.invite_code;
  END IF;
  IF NEW.created_by IS NULL THEN NEW.created_by := NEW.owner_id; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.auto_add_all_users_to_squad()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  SELECT NEW.id, NEW.owner_id, 'owner'::squad_member_role
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.notify_on_squad_join()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE joiner_name text; group_name text; m record;
BEGIN
  SELECT COALESCE(full_name, 'Someone') INTO joiner_name FROM public.profiles WHERE id = NEW.user_id;
  SELECT COALESCE(name, 'a group') INTO group_name FROM public.groups WHERE id = NEW.group_id;
  FOR m IN SELECT user_id FROM public.group_members WHERE group_id = NEW.group_id AND user_id <> NEW.user_id LOOP
    INSERT INTO public.notifications (title, body, link, audience, target_user_id, created_by)
    VALUES ('👋 ' || joiner_name || ' joined ' || group_name, 'Say hi in the group chat.',
      '/squad/' || NEW.group_id::text, 'user', m.user_id, NEW.user_id);
  END LOOP;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.notify_on_squad_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE sender_name text; group_name text; recent_exists boolean; preview text;
        is_important boolean; m record; pref public.squad_notify_mode;
BEGIN
  IF NEW.type = 'system' THEN RETURN NEW; END IF;
  SELECT EXISTS(
    SELECT 1 FROM public.study_group_messages
    WHERE group_id = NEW.group_id AND user_id = NEW.user_id AND id <> NEW.id
      AND created_at > (NEW.created_at - interval '30 minutes')
  ) INTO recent_exists;
  IF recent_exists THEN RETURN NEW; END IF;

  SELECT COALESCE(full_name, 'Someone') INTO sender_name FROM public.profiles WHERE id = NEW.user_id;
  SELECT COALESCE(name, 'your group') INTO group_name FROM public.groups WHERE id = NEW.group_id;
  preview := left(COALESCE(NEW.body, ''), 80);
  is_important := (NEW.body ILIKE '%@everyone%' OR NEW.body ILIKE '%@important%' OR NEW.body ILIKE '!important%');

  FOR m IN SELECT user_id FROM public.group_members WHERE group_id = NEW.group_id AND user_id <> NEW.user_id LOOP
    SELECT mode INTO pref FROM public.squad_notification_prefs WHERE user_id = m.user_id AND group_id = NEW.group_id;
    IF pref IS NULL THEN pref := 'all'; END IF;
    IF pref = 'muted' THEN CONTINUE; END IF;
    IF pref = 'important' AND NOT is_important THEN CONTINUE; END IF;
    INSERT INTO public.notifications (title, body, link, audience, target_user_id, created_by)
    VALUES (sender_name || (CASE WHEN is_important THEN ' · ⚠ important in ' ELSE ' is chatting in ' END) || group_name,
      CASE WHEN preview = '' THEN NULL ELSE '"' || preview || '"' END,
      '/squad/' || NEW.group_id::text, 'user', m.user_id, NEW.user_id);
  END LOOP;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  reg_cert_id uuid; admin_id uuid; welcome_body text;
  is_guest_user boolean := COALESCE(NEW.is_anonymous, false);
  guest_seq int; guest_name text;
BEGIN
  IF is_guest_user THEN
    SELECT COUNT(*) + 1 INTO guest_seq FROM public.profiles WHERE is_guest = true;
    guest_name := 'Guest User ' || guest_seq;
    INSERT INTO public.profiles (id, full_name, avatar_url, is_guest) VALUES (NEW.id, guest_name, NULL, true);
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student') ON CONFLICT DO NOTHING;
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student') ON CONFLICT DO NOTHING;

  SELECT id INTO reg_cert_id FROM public.certificate_types WHERE code = 'registration' LIMIT 1;
  IF reg_cert_id IS NOT NULL THEN
    INSERT INTO public.user_certificates (user_id, certificate_type_id, verification_code)
    VALUES (NEW.id, reg_cert_id, upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)));
    INSERT INTO public.notifications (title, body, link, audience, target_user_id, created_by)
    VALUES ('🎓 You earned the Official Member certificate!',
      'Welcome to JEE Prep Hub — view and download your certificate.', '/certificates', 'user', NEW.id, NEW.id);
  END IF;

  INSERT INTO public.follows (follower_id, following_id)
  SELECT NEW.id, ur.user_id FROM public.user_roles ur
  WHERE ur.role = 'admin' AND ur.user_id <> NEW.id ON CONFLICT DO NOTHING;

  SELECT ur.user_id INTO admin_id FROM public.user_roles ur WHERE ur.role = 'admin' ORDER BY ur.created_at ASC LIMIT 1;
  IF admin_id IS NOT NULL AND admin_id <> NEW.id THEN
    welcome_body := '👋 Welcome to JEE Prep Hub! Explore materials, timer, groups and more. — Admin';
    INSERT INTO public.direct_messages (sender_id, recipient_id, body) VALUES (admin_id, NEW.id, welcome_body);
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.sweep_expired_guests()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE victim uuid; deleted_count int := 0;
BEGIN
  FOR victim IN
    SELECT p.id FROM public.profiles p JOIN auth.users u ON u.id = p.id
    WHERE p.is_guest = true AND COALESCE(u.is_anonymous, false) = true
      AND ((p.guest_left_at IS NOT NULL AND p.guest_left_at < now() - interval '30 seconds')
        OR (COALESCE(p.last_seen_at, u.created_at) < now() - interval '10 minutes'))
  LOOP
    DELETE FROM public.feed_likes WHERE user_id = victim;
    DELETE FROM public.feed_comments WHERE user_id = victim;
    DELETE FROM public.feed_posts WHERE user_id = victim;
    DELETE FROM public.profile_post_likes WHERE user_id = victim;
    DELETE FROM public.profile_post_comments WHERE user_id = victim;
    DELETE FROM public.profile_posts WHERE user_id = victim;
    DELETE FROM public.chat_message_reactions WHERE user_id = victim;
    DELETE FROM public.chat_messages WHERE user_id = victim;
    DELETE FROM public.direct_messages WHERE sender_id = victim OR recipient_id = victim;
    DELETE FROM public.follows WHERE follower_id = victim OR following_id = victim;
    DELETE FROM public.study_sessions WHERE user_id = victim;
    DELETE FROM public.notification_reads WHERE user_id = victim;
    DELETE FROM public.notifications WHERE target_user_id = victim OR created_by = victim;
    DELETE FROM public.user_consents WHERE user_id = victim;
    DELETE FROM public.user_roles WHERE user_id = victim;
    DELETE FROM public.user_certificates WHERE user_id = victim;
    DELETE FROM public.sahai_messages WHERE user_id = victim;
    DELETE FROM public.study_group_messages WHERE user_id = victim;
    DELETE FROM public.group_members WHERE user_id = victim;
    DELETE FROM public.profiles WHERE id = victim;
    DELETE FROM auth.users WHERE id = victim;
    deleted_count := deleted_count + 1;
  END LOOP;
  RETURN deleted_count;
END $$;

REVOKE EXECUTE ON FUNCTION public.is_squad_admin(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.gen_squad_invite_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_squad_invite_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_add_all_users_to_squad() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_squad_join() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_squad_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sweep_expired_guests() FROM PUBLIC, anon, authenticated;

-- ============ 8. DELAYED TEST RESULTS + 4-MARK DEFAULT ============
ALTER TABLE public.test_attempts
  ADD COLUMN results_at timestamptz,
  ADD COLUMN results_notified boolean NOT NULL DEFAULT false;
UPDATE public.test_attempts SET results_at = COALESCE(submitted_at, created_at)
 WHERE submitted_at IS NOT NULL AND results_at IS NULL;

ALTER TABLE public.test_questions ALTER COLUMN marks SET DEFAULT 4;
ALTER TABLE public.test_questions ALTER COLUMN negative_marks SET DEFAULT 1;
ALTER TABLE public.tests ALTER COLUMN default_marks_per_question SET DEFAULT 4;
ALTER TABLE public.tests ALTER COLUMN default_negative_per_question SET DEFAULT 1;
UPDATE public.test_questions SET marks = 4 WHERE marks IS NULL OR marks = 0;

CREATE OR REPLACE FUNCTION public.publish_due_test_results()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r record; n int := 0;
BEGIN
  FOR r IN
    SELECT a.id, a.user_id, a.test_id, t.name FROM public.test_attempts a
    JOIN public.tests t ON t.id = a.test_id
    WHERE a.results_notified = false AND a.results_at IS NOT NULL AND a.results_at <= now()
      AND a.status IN ('submitted','auto_submitted')
    LIMIT 200
  LOOP
    INSERT INTO public.notifications (title, body, link, audience, target_user_id, created_by)
    VALUES ('📊 Your result is ready', 'Results for "' || r.name || '" have been published.',
      '/tests/result/' || r.id::text, 'user', r.user_id, r.user_id);
    UPDATE public.test_attempts SET results_notified = true WHERE id = r.id;
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;
REVOKE EXECUTE ON FUNCTION public.publish_due_test_results() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.test_attempt_counts(_test_ids uuid[])
RETURNS TABLE(test_id uuid, attempts bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT a.test_id, count(DISTINCT a.user_id)::bigint
  FROM public.test_attempts a
  WHERE a.test_id = ANY(_test_ids) AND a.status IN ('submitted','auto_submitted')
  GROUP BY a.test_id
$$;
REVOKE EXECUTE ON FUNCTION public.test_attempt_counts(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.test_attempt_counts(uuid[]) TO authenticated, service_role;