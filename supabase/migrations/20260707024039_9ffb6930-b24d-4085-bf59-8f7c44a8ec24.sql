
-- Revoke EXECUTE from anon/authenticated on SECURITY DEFINER functions that
-- should never be exposed through PostgREST. These are all trigger functions
-- or admin-only helpers; they still execute as part of triggers/RLS since
-- SECURITY DEFINER runs as the owner and triggers don't need caller EXECUTE.
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'notify_on_feed_comment()',
    'notify_on_feed_like()',
    'notify_on_squad_join()',
    'notify_on_chat_message()',
    'notify_on_follow()',
    'notify_on_notice()',
    'notify_on_feed_post()',
    'notify_on_first_dm()',
    'notify_on_squad_message()',
    'handle_new_user()',
    'ensure_squad_invite_code()',
    'guard_chat_moderation_columns()',
    'auto_add_all_users_to_squad()',
    'touch_updated_at()',
    'gen_squad_invite_code()',
    'list_admin_ids()',
    'study_totals_since(timestamptz)'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', fn);
  END LOOP;
END $$;

-- Helpers used inside RLS policies must remain callable by authenticated so
-- policy evaluation can invoke them, but remove anon access.
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_squad_admin(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_squad_admin(uuid, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_user_active(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_user_active(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.can_user_post(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_user_post(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.can_user_message(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_user_message(uuid) TO authenticated, service_role;

-- list_dm_conversations reads auth.uid() and is legitimately called by
-- signed-in users from the app.
REVOKE ALL ON FUNCTION public.list_dm_conversations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_dm_conversations() TO authenticated, service_role;
