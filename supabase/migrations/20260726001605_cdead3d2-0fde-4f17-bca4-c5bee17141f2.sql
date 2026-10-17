
-- 1. Guest identity helper
CREATE OR REPLACE FUNCTION public.is_guest_session()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false)
      OR COALESCE((SELECT is_guest FROM public.profiles WHERE id = auth.uid()), false);
$$;

REVOKE EXECUTE ON FUNCTION public.is_guest_session() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_guest_session() TO authenticated, anon;

-- 2. Track guest activity for the sweeper
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guest_left_at timestamptz;
CREATE INDEX IF NOT EXISTS profiles_guest_sweep_idx
  ON public.profiles (is_guest, last_seen_at) WHERE is_guest = true;

-- 3. RESTRICTIVE default-deny writes for guests across every write-capable public table
DO $$
DECLARE
  t text;
  target_tables text[] := ARRAY[
    'feed_posts','feed_comments','feed_likes',
    'profile_posts','profile_post_likes','profile_post_comments',
    'chat_messages','chat_message_reactions',
    'direct_messages',
    'follows',
    'forum_threads','forum_replies',
    'study_group_messages','study_group_members','study_groups','squad_notification_prefs',
    'poll_votes','polls',
    'contact_messages','moderation_appeals',
    'notification_reads',
    'user_daily_targets','topic_progress','daily_tasks','streak_recoveries','study_sessions',
    'user_consents','pro_subscriptions','user_certificates'
  ];
BEGIN
  FOREACH t IN ARRAY target_tables LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=t) THEN
      EXECUTE format('DROP POLICY IF EXISTS "guests_no_insert" ON public.%I', t);
      EXECUTE format('DROP POLICY IF EXISTS "guests_no_update" ON public.%I', t);
      EXECUTE format('DROP POLICY IF EXISTS "guests_no_delete" ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY "guests_no_insert" ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (NOT public.is_guest_session())', t);
      EXECUTE format(
        'CREATE POLICY "guests_no_update" ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated USING (NOT public.is_guest_session()) WITH CHECK (NOT public.is_guest_session())', t);
      EXECUTE format(
        'CREATE POLICY "guests_no_delete" ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated USING (NOT public.is_guest_session())', t);
    END IF;
  END LOOP;
END $$;

-- 4. Profile self-writes: allow guests to update their OWN last_seen_at / guest_left_at only,
--    but block them from editing bio/avatar/name/etc. via a column-scoped restrictive policy.
--    Simpler: block all guest updates on profiles except by service role.
DROP POLICY IF EXISTS "guests_no_profile_update" ON public.profiles;
CREATE POLICY "guests_no_profile_update" ON public.profiles
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (NOT public.is_guest_session() OR id = auth.uid())
  WITH CHECK (NOT public.is_guest_session() OR id = auth.uid());
-- Note: we still let guests update their OWN row (needed for last_seen heartbeat).
-- A trigger below prevents them from changing anything except last_seen_at / guest_left_at.

CREATE OR REPLACE FUNCTION public.guard_guest_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_guest_session() THEN
    -- Only last_seen_at & guest_left_at may change
    NEW.full_name          := OLD.full_name;
    NEW.avatar_url         := OLD.avatar_url;
    NEW.bio                := OLD.bio;
    NEW.class_level        := OLD.class_level;
    NEW.username           := OLD.username;
    NEW.verified           := OLD.verified;
    NEW.instagram          := OLD.instagram;
    NEW.youtube            := OLD.youtube;
    NEW.telegram           := OLD.telegram;
    NEW.website            := OLD.website;
    NEW.migrated           := OLD.migrated;
    NEW.migrated_at        := OLD.migrated_at;
    NEW.has_seen_onboarding := OLD.has_seen_onboarding;
    NEW.is_guest           := OLD.is_guest;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_guard_guest_profile_columns ON public.profiles;
CREATE TRIGGER trg_guard_guest_profile_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_guest_profile_columns();

-- 5. Hide guests from other users' reads on profiles
--    Replace the broad public SELECT policy with one that excludes guest rows,
--    while letting the guest see their own row.
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND cmd='SELECT' LOOP
    EXECUTE format('DROP POLICY %I ON public.profiles', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "profiles readable, guests hidden"
  ON public.profiles FOR SELECT
  USING (
    is_guest IS NOT TRUE
    OR id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

-- 6. Guest sweeper — deletes anonymous auth users + cascading rows.
--    Runs every 5 min via pg_cron; targets guests idle > 10 min OR explicitly marked "left".
CREATE OR REPLACE FUNCTION public.sweep_expired_guests()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  victim uuid;
  deleted_count int := 0;
BEGIN
  FOR victim IN
    SELECT p.id
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE p.is_guest = true
      AND COALESCE(u.is_anonymous, false) = true
      AND (
        (p.guest_left_at IS NOT NULL AND p.guest_left_at < now() - interval '30 seconds')
        OR (COALESCE(p.last_seen_at, u.created_at) < now() - interval '10 minutes')
      )
  LOOP
    -- Belt-and-suspenders: purge rows that might be authored by the guest (should be none due to RLS,
    -- but legacy pre-lockdown data may exist).
    DELETE FROM public.feed_likes           WHERE user_id = victim;
    DELETE FROM public.feed_comments        WHERE user_id = victim;
    DELETE FROM public.feed_posts           WHERE user_id = victim;
    DELETE FROM public.profile_post_likes   WHERE user_id = victim;
    DELETE FROM public.profile_post_comments WHERE user_id = victim;
    DELETE FROM public.profile_posts        WHERE user_id = victim;
    DELETE FROM public.chat_message_reactions WHERE user_id = victim;
    DELETE FROM public.chat_messages        WHERE user_id = victim;
    DELETE FROM public.direct_messages      WHERE sender_id = victim OR recipient_id = victim;
    DELETE FROM public.follows              WHERE follower_id = victim OR following_id = victim;
    DELETE FROM public.study_sessions       WHERE user_id = victim;
    DELETE FROM public.notification_reads   WHERE user_id = victim;
    DELETE FROM public.notifications        WHERE target_user_id = victim OR created_by = victim;
    DELETE FROM public.user_consents        WHERE user_id = victim;
    DELETE FROM public.user_roles           WHERE user_id = victim;
    DELETE FROM public.user_certificates    WHERE user_id = victim;
    DELETE FROM public.study_group_members  WHERE user_id = victim;
    -- Profile row
    DELETE FROM public.profiles             WHERE id = victim;
    -- Auth user (cascades to remaining refs)
    DELETE FROM auth.users                  WHERE id = victim;
    deleted_count := deleted_count + 1;
  END LOOP;
  RETURN deleted_count;
END $$;

REVOKE EXECUTE ON FUNCTION public.sweep_expired_guests() FROM PUBLIC, anon, authenticated;

-- 7. Schedule the sweeper every 5 minutes via pg_cron (extension already available on Supabase).
CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sweep_expired_guests') THEN
    PERFORM cron.unschedule('sweep_expired_guests');
  END IF;
  PERFORM cron.schedule(
    'sweep_expired_guests',
    '*/5 * * * *',
    $cron$ SELECT public.sweep_expired_guests(); $cron$
  );
END $$;
