
-- 1. Restrict community_groups SELECT to authenticated users (invite URLs are private)
DROP POLICY IF EXISTS "Public can view active community groups" ON public.community_groups;
CREATE POLICY "Signed-in users can view active community groups"
  ON public.community_groups FOR SELECT TO authenticated
  USING (is_active = true);

-- 2. Revoke EXECUTE from public/anon/authenticated on trigger-only SECURITY DEFINER functions.
--    Triggers still fire as the table owner; these functions should never be called via RPC.
DO $$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.handle_new_user()',
    'public.touch_updated_at()',
    'public.ensure_squad_invite_code()',
    'public.gen_squad_invite_code()',
    'public.guard_chat_moderation_columns()',
    'public.auto_add_all_users_to_squad()',
    'public.notify_on_feed_like()',
    'public.notify_on_feed_post()',
    'public.notify_on_feed_comment()',
    'public.notify_on_first_dm()',
    'public.notify_on_chat_message()',
    'public.notify_on_squad_message()',
    'public.notify_on_squad_join()',
    'public.notify_on_follow()',
    'public.notify_on_notice()'
  ]
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
  END LOOP;
END $$;
