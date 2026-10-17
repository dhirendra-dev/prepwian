CREATE TABLE public.ai_key_exemptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reason text,
  admin_note text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.ai_key_exemptions TO authenticated;
GRANT ALL ON public.ai_key_exemptions TO service_role;

ALTER TABLE public.ai_key_exemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_exemption_read" ON public.ai_key_exemptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "own_exemption_request" ON public.ai_key_exemptions
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
    AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );

CREATE POLICY "admin_exemption_all" ON public.ai_key_exemptions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_ai_key_exemptions_updated_at
  BEFORE UPDATE ON public.ai_key_exemptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.ai_key_exemptions (user_id, status, reason, reviewed_by, reviewed_at)
SELECT a.user_id, 'approved', 'Migrated from earlier site-AI grant', a.granted_by, now()
FROM public.test_ai_access a
ON CONFLICT (user_id) DO NOTHING;