
-- ============================================================
-- PHASE 1: Lock down anon access on sensitive tables
-- ============================================================

-- Profiles: require authentication to view
DROP POLICY IF EXISTS "Profiles are publicly viewable" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.profiles FROM anon;

-- Materials: authenticated only
DROP POLICY IF EXISTS "Public can view materials" ON public.materials;
REVOKE SELECT ON public.materials FROM anon;

-- Chat messages: authenticated only (was role 'public' which includes anon)
DROP POLICY IF EXISTS "chat read public" ON public.chat_messages;
CREATE POLICY "chat read authenticated"
  ON public.chat_messages FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.chat_messages FROM anon;

-- Feed posts: authenticated only
DROP POLICY IF EXISTS "feed_posts public read" ON public.feed_posts;
CREATE POLICY "feed_posts authenticated read"
  ON public.feed_posts FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.feed_posts FROM anon;

-- Bulk: revoke any lingering anon access on public tables (safety net)
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
    EXECUTE format('REVOKE SELECT, INSERT, UPDATE, DELETE ON public.%I FROM anon', t.tablename);
  END LOOP;
END $$;

-- ============================================================
-- PHASE 2: Moderation, security events, IP blocks
-- ============================================================

-- User moderation status
CREATE TABLE IF NOT EXISTS public.user_moderation (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','banned')),
  reason text,
  suspended_until timestamptz,
  can_post boolean NOT NULL DEFAULT true,
  can_message boolean NOT NULL DEFAULT true,
  set_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_moderation TO authenticated;
GRANT ALL ON public.user_moderation TO service_role;
ALTER TABLE public.user_moderation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "self can read own moderation" ON public.user_moderation
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "admins write moderation" ON public.user_moderation
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_user_moderation_updated BEFORE UPDATE ON public.user_moderation
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Helper to check if caller is currently active (not banned/suspended)
CREATE OR REPLACE FUNCTION public.is_user_active(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.user_moderation
    WHERE user_id = _user_id
      AND (status = 'banned'
        OR (status = 'suspended' AND (suspended_until IS NULL OR suspended_until > now())))
  );
$$;

CREATE OR REPLACE FUNCTION public.can_user_post(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_user_active(_user_id) AND NOT EXISTS (
    SELECT 1 FROM public.user_moderation WHERE user_id = _user_id AND can_post = false
  );
$$;

CREATE OR REPLACE FUNCTION public.can_user_message(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_user_active(_user_id) AND NOT EXISTS (
    SELECT 1 FROM public.user_moderation WHERE user_id = _user_id AND can_message = false
  );
$$;

-- Enforce moderation on writes (add restrictive companion policies)
DROP POLICY IF EXISTS "feed_posts ban check" ON public.feed_posts;
CREATE POLICY "feed_posts ban check" ON public.feed_posts AS RESTRICTIVE
  FOR INSERT TO authenticated WITH CHECK (public.can_user_post(auth.uid()));

DROP POLICY IF EXISTS "feed_comments ban check" ON public.feed_comments;
CREATE POLICY "feed_comments ban check" ON public.feed_comments AS RESTRICTIVE
  FOR INSERT TO authenticated WITH CHECK (public.can_user_post(auth.uid()));

DROP POLICY IF EXISTS "chat ban check" ON public.chat_messages;
CREATE POLICY "chat ban check" ON public.chat_messages AS RESTRICTIVE
  FOR INSERT TO authenticated WITH CHECK (public.can_user_message(auth.uid()));

DROP POLICY IF EXISTS "dm ban check" ON public.direct_messages;
CREATE POLICY "dm ban check" ON public.direct_messages AS RESTRICTIVE
  FOR INSERT TO authenticated WITH CHECK (public.can_user_message(auth.uid()));

DROP POLICY IF EXISTS "squad msg ban check" ON public.study_group_messages;
CREATE POLICY "squad msg ban check" ON public.study_group_messages AS RESTRICTIVE
  FOR INSERT TO authenticated WITH CHECK (public.can_user_message(auth.uid()));

-- Security events log
CREATE TABLE IF NOT EXISTS public.user_security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  ip_hash text,
  user_agent text,
  device text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sec_events_user ON public.user_security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sec_events_type ON public.user_security_events(event_type, created_at DESC);
GRANT SELECT, INSERT ON public.user_security_events TO authenticated;
GRANT ALL ON public.user_security_events TO service_role;
ALTER TABLE public.user_security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own events" ON public.user_security_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "users insert own events" ON public.user_security_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Blocked IPs (stored as sha256 hash)
CREATE TABLE IF NOT EXISTS public.blocked_ips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL UNIQUE,
  reason text,
  created_by uuid REFERENCES auth.users(id),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocked_ips TO authenticated;
GRANT ALL ON public.blocked_ips TO service_role;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage blocked ips" ON public.blocked_ips
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Admin notes per user
CREATE TABLE IF NOT EXISTS public.admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_notes_target ON public.admin_notes(target_user_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.admin_notes TO authenticated;
GRANT ALL ON public.admin_notes TO service_role;
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read notes" ON public.admin_notes
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "admins write notes" ON public.admin_notes
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin') AND auth.uid() = author_id);
CREATE POLICY "admins delete notes" ON public.admin_notes
  FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
