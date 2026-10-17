
CREATE TABLE public.user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consented_at timestamptz NOT NULL DEFAULT now(),
  purpose text NOT NULL,
  -- device
  user_agent text,
  platform text,
  os text,
  browser text,
  language text,
  timezone text,
  screen_size text,
  device_pixel_ratio numeric,
  -- network / ip
  ip_address text,
  ip_city text,
  ip_region text,
  ip_country text,
  ip_isp text,
  -- gps
  gps_latitude numeric,
  gps_longitude numeric,
  gps_accuracy numeric,
  -- profile
  full_name text,
  phone text,
  dob date,
  address_line text,
  city text,
  state text,
  pincode text,
  school text,
  class_level text,
  parent_name text,
  parent_phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.user_consents TO authenticated;
GRANT ALL ON public.user_consents TO service_role;

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own consent"
  ON public.user_consents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all consents"
  ON public.user_consents FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_user_consents_user_id ON public.user_consents(user_id);

CREATE TRIGGER trg_user_consents_updated
  BEFORE UPDATE ON public.user_consents
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
