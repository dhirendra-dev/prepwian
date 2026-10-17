
CREATE TABLE public.notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  pinned boolean NOT NULL DEFAULT false,
  link_url text,
  link_label text,
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.notices TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notices TO authenticated;
GRANT ALL ON public.notices TO service_role;

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notices public read"
  ON public.notices FOR SELECT
  USING (expires_at IS NULL OR expires_at > now());

CREATE POLICY "notices admin insert"
  ON public.notices FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "notices admin update"
  ON public.notices FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "notices admin delete"
  ON public.notices FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX notices_pinned_created_idx ON public.notices (pinned DESC, created_at DESC);

CREATE TRIGGER notices_touch_updated_at
  BEFORE UPDATE ON public.notices
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-notify all members when a new notice is published
CREATE OR REPLACE FUNCTION public.notify_on_notice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (title, body, link, audience, target_user_id, created_by)
  VALUES (
    '📢 Notice: ' || NEW.title,
    left(NEW.body, 140),
    '/notices',
    'all',
    NULL,
    NEW.created_by
  );
  RETURN NEW;
END $$;

CREATE TRIGGER trg_notify_on_notice
  AFTER INSERT ON public.notices
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_notice();
