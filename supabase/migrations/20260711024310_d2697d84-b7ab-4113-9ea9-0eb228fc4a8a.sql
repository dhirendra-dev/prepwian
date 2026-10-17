
REVOKE EXECUTE ON FUNCTION public.notify_admins_on_appeal() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_user_on_appeal_decision() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admins_on_contact() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_user_on_contact_reply() FROM PUBLIC, anon, authenticated;
