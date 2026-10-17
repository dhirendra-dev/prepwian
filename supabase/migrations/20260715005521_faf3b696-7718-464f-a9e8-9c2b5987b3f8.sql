
CREATE TYPE public.pro_plan AS ENUM ('trial','monthly','yearly','lifetime');
CREATE TYPE public.pro_status AS ENUM ('active','expired','cancelled');

CREATE TABLE public.pro_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan public.pro_plan NOT NULL,
  status public.pro_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  granted_by UUID REFERENCES auth.users(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pro_subs_user ON public.pro_subscriptions(user_id);
CREATE INDEX idx_pro_subs_active ON public.pro_subscriptions(user_id, status) WHERE status = 'active';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pro_subscriptions TO authenticated;
GRANT ALL ON public.pro_subscriptions TO service_role;

ALTER TABLE public.pro_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own subscription"
  ON public.pro_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert subscriptions"
  ON public.pro_subscriptions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update subscriptions"
  ON public.pro_subscriptions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete subscriptions"
  ON public.pro_subscriptions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_pro_subs_updated_at
  BEFORE UPDATE ON public.pro_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.is_pro(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pro_subscriptions
    WHERE user_id = _user_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_pro(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_pro(UUID) TO authenticated, service_role;

ALTER PUBLICATION supabase_realtime ADD TABLE public.pro_subscriptions;
