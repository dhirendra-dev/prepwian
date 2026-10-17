
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own contact messages"
  ON public.contact_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own contact messages"
  ON public.contact_messages FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update contact messages"
  ON public.contact_messages FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_contact_messages_updated
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Notify all admins on new contact message
CREATE OR REPLACE FUNCTION public.notify_admins_on_contact()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  a record;
  preview text;
BEGIN
  preview := left(COALESCE(NEW.body, ''), 120);
  FOR a IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
    INSERT INTO public.notifications (title, body, link, audience, target_user_id, created_by)
    VALUES (
      '📮 New contact message: ' || NEW.subject,
      COALESCE(NEW.user_email, '') || ' — ' || preview,
      '/admin/contact',
      'user',
      a.user_id,
      NEW.user_id
    );
  END LOOP;
  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.notify_admins_on_contact() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_notify_admins_on_contact
  AFTER INSERT ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_on_contact();
