-- Temporary developer access requests
CREATE TABLE IF NOT EXISTS public.developer_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_message_id UUID REFERENCES public.contact_messages(id) ON DELETE SET NULL,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_email TEXT,
  purpose TEXT NOT NULL,
  details TEXT NOT NULL,
  requested_duration TEXT NOT NULL CHECK (requested_duration IN ('1 hour', '1 day', '1 week', 'Other / administrator discretion')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_until TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  reviewer_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_developer_access_requests_status_created
  ON public.developer_access_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_developer_access_requests_requester
  ON public.developer_access_requests(requester_id, created_at DESC);

GRANT SELECT, INSERT ON public.developer_access_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.developer_access_requests TO service_role;

ALTER TABLE public.developer_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own developer access requests"
  ON public.developer_access_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users view own developer access requests"
  ON public.developer_access_requests FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins review developer access requests"
  ON public.developer_access_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_developer_access_requests_updated
  BEFORE UPDATE ON public.developer_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
