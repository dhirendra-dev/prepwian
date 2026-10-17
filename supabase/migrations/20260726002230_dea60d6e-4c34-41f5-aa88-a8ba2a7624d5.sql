
-- 1) user_certificates: remove public read; owner + admin only
DROP POLICY IF EXISTS "Anyone can view earned certificates" ON public.user_certificates;
DROP POLICY IF EXISTS "Users view own certificates" ON public.user_certificates;
DROP POLICY IF EXISTS "Admins view all certificates" ON public.user_certificates;

CREATE POLICY "Users view own certificates"
  ON public.user_certificates
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all certificates"
  ON public.user_certificates
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) Storage: reject anonymous (is_anonymous JWT) on sensitive policies
DROP POLICY IF EXISTS "Avatars are readable by authenticated users" ON storage.objects;
CREATE POLICY "Avatars are readable by authenticated users"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND COALESCE((auth.jwt()->>'is_anonymous')::boolean, false) = false);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND COALESCE((auth.jwt()->>'is_anonymous')::boolean, false) = false);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND COALESCE((auth.jwt()->>'is_anonymous')::boolean, false) = false);

DROP POLICY IF EXISTS "Squad members can read squad files" ON storage.objects;
CREATE POLICY "Squad members can read squad files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'squad-files'
    AND COALESCE((auth.jwt()->>'is_anonymous')::boolean, false) = false
    AND EXISTS (
      SELECT 1 FROM public.study_group_members m
      WHERE m.user_id = auth.uid()
        AND m.group_id::text = (storage.foldername(objects.name))[1]
    )
  );

DROP POLICY IF EXISTS "Uploaders and squad admins can delete squad files" ON storage.objects;
CREATE POLICY "Uploaders and squad admins can delete squad files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'squad-files'
    AND COALESCE((auth.jwt()->>'is_anonymous')::boolean, false) = false
    AND (
      owner = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.study_group_members m
        WHERE m.user_id = auth.uid()
          AND m.group_id::text = (storage.foldername(objects.name))[1]
          AND m.role IN ('admin'::squad_member_role, 'owner'::squad_member_role)
      )
    )
  );

DROP POLICY IF EXISTS "profile_posts_storage_delete_own" ON storage.objects;
CREATE POLICY "profile_posts_storage_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profile-posts'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND COALESCE((auth.jwt()->>'is_anonymous')::boolean, false) = false);

DROP POLICY IF EXISTS "profile_posts_storage_update_own" ON storage.objects;
CREATE POLICY "profile_posts_storage_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-posts'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND COALESCE((auth.jwt()->>'is_anonymous')::boolean, false) = false);

-- 3) Lock down SECURITY DEFINER functions that are not required to be called by end users.
-- Trigger functions: revoke from PUBLIC/anon/authenticated (triggers execute as table owner regardless).
REVOKE ALL ON FUNCTION public.auto_add_all_users_to_squad() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_mirrored_feed_post() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_chat_moderation_columns() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_guest_profile_columns() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_profile_verified() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mirror_profile_post_to_feed() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_admins_on_appeal() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_admins_on_contact() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_chat_message() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_feed_comment() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_feed_like() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_feed_post() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_first_dm() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_follow() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_notice() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_squad_join() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_squad_message() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_user_on_appeal_decision() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_user_on_contact_reply() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_weekly_leaderboard_total() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sweep_expired_guests() FROM PUBLIC, anon, authenticated;

-- Helper used only inside RESTRICTIVE policies applied to `authenticated` role.
-- Revoke from PUBLIC/anon; keep authenticated so policies can evaluate.
REVOKE ALL ON FUNCTION public.is_guest_session() FROM PUBLIC, anon;

-- list_admin_ids / study_totals_since: keep authenticated (used by signed-in features),
-- revoke from PUBLIC/anon to fix anonymous exposure.
REVOKE ALL ON FUNCTION public.list_admin_ids() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.study_totals_since(timestamptz) FROM PUBLIC, anon;
