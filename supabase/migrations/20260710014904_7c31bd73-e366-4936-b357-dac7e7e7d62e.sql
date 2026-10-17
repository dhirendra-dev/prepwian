
-- Appeals
CREATE TABLE public.moderation_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_response text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.moderation_appeals TO authenticated;
GRANT ALL ON public.moderation_appeals TO service_role;
ALTER TABLE public.moderation_appeals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own appeals" ON public.moderation_appeals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own appeals" ON public.moderation_appeals
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update appeals" ON public.moderation_appeals
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_moderation_appeals_updated
  BEFORE UPDATE ON public.moderation_appeals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Notify admins on new appeal
CREATE OR REPLACE FUNCTION public.notify_admins_on_appeal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a record; preview text;
BEGIN
  preview := left(COALESCE(NEW.message,''), 140);
  FOR a IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
    INSERT INTO public.notifications (title, body, link, audience, target_user_id, created_by)
    VALUES ('⚖️ New account appeal', preview, '/admin/appeals', 'user', a.user_id, NEW.user_id);
  END LOOP;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.notify_admins_on_appeal() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_notify_admins_on_appeal
  AFTER INSERT ON public.moderation_appeals
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_on_appeal();

-- Notify user on appeal decision
CREATE OR REPLACE FUNCTION public.notify_user_on_appeal_decision()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('approved','rejected') THEN
    INSERT INTO public.notifications (title, body, link, audience, target_user_id, created_by)
    VALUES (
      CASE WHEN NEW.status = 'approved' THEN '✅ Your appeal was approved' ELSE '❌ Your appeal was rejected' END,
      left(COALESCE(NEW.admin_response, ''), 200),
      '/appeal', 'user', NEW.user_id, NEW.reviewed_by
    );
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.notify_user_on_appeal_decision() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_notify_user_on_appeal_decision
  AFTER UPDATE ON public.moderation_appeals
  FOR EACH ROW EXECUTE FUNCTION public.notify_user_on_appeal_decision();

-- Contact replies
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS admin_reply text,
  ADD COLUMN IF NOT EXISTS replied_at timestamptz,
  ADD COLUMN IF NOT EXISTS replied_by uuid;

-- Ensure users can read their own contact messages
DROP POLICY IF EXISTS "Users read own contact messages" ON public.contact_messages;
CREATE POLICY "Users read own contact messages" ON public.contact_messages
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.notify_user_on_contact_reply()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.admin_reply IS DISTINCT FROM OLD.admin_reply AND NEW.admin_reply IS NOT NULL AND NEW.user_id IS NOT NULL THEN
    INSERT INTO public.notifications (title, body, link, audience, target_user_id, created_by)
    VALUES (
      '📬 Admin replied: ' || NEW.subject,
      left(NEW.admin_reply, 200),
      '/contact',
      'user',
      NEW.user_id,
      NEW.replied_by
    );
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.notify_user_on_contact_reply() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_notify_user_on_contact_reply
  AFTER UPDATE ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_user_on_contact_reply();
