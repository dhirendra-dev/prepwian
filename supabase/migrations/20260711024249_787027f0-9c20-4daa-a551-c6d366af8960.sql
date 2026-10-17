
-- Wire missing triggers so appeal decisions notify the user and admin contact replies notify the user, plus admins get pinged on new appeals.
DROP TRIGGER IF EXISTS trg_notify_admins_on_appeal ON public.moderation_appeals;
CREATE TRIGGER trg_notify_admins_on_appeal
AFTER INSERT ON public.moderation_appeals
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_on_appeal();

DROP TRIGGER IF EXISTS trg_notify_user_on_appeal_decision ON public.moderation_appeals;
CREATE TRIGGER trg_notify_user_on_appeal_decision
AFTER UPDATE ON public.moderation_appeals
FOR EACH ROW EXECUTE FUNCTION public.notify_user_on_appeal_decision();

DROP TRIGGER IF EXISTS trg_notify_admins_on_contact ON public.contact_messages;
CREATE TRIGGER trg_notify_admins_on_contact
AFTER INSERT ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_on_contact();

DROP TRIGGER IF EXISTS trg_notify_user_on_contact_reply ON public.contact_messages;
CREATE TRIGGER trg_notify_user_on_contact_reply
AFTER UPDATE ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_user_on_contact_reply();
