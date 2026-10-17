
-- Profiles: username, verified, social links
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text UNIQUE,
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS youtube text,
  ADD COLUMN IF NOT EXISTS telegram text,
  ADD COLUMN IF NOT EXISTS website text;

-- Enforce username shape via trigger (allow NULL)
CREATE OR REPLACE FUNCTION public.validate_username()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.username IS NOT NULL THEN
    NEW.username := lower(NEW.username);
    IF NEW.username !~ '^[a-z0-9_.]{3,20}$' THEN
      RAISE EXCEPTION 'Username must be 3-20 chars, lowercase letters, numbers, dot or underscore';
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.validate_username() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_validate_username ON public.profiles;
CREATE TRIGGER trg_validate_username BEFORE INSERT OR UPDATE OF username ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_username();

-- Only admins can toggle `verified`
CREATE OR REPLACE FUNCTION public.guard_profile_verified()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.verified IS DISTINCT FROM OLD.verified AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.verified := OLD.verified;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.guard_profile_verified() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_profile_verified ON public.profiles;
CREATE TRIGGER trg_guard_profile_verified BEFORE UPDATE OF verified ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_verified();

-- Message tick + delete-for-everyone columns
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS read_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_for_everyone boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.direct_messages
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_for_everyone boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.study_group_messages
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS read_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_for_everyone boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Toppers table
CREATE TABLE IF NOT EXISTS public.toppers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  exam text NOT NULL CHECK (exam IN ('jee_main','jee_advanced','neet')),
  rank integer NOT NULL,
  name text NOT NULL,
  city text,
  state text,
  marks text,
  percentile text,
  photo_url text,
  source_url text,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.toppers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.toppers TO authenticated;
GRANT ALL ON public.toppers TO service_role;

ALTER TABLE public.toppers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Toppers are viewable by everyone"
  ON public.toppers FOR SELECT USING (true);

CREATE POLICY "Admins can insert toppers"
  ON public.toppers FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update toppers"
  ON public.toppers FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete toppers"
  ON public.toppers FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_toppers_touch BEFORE UPDATE ON public.toppers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_toppers_year_exam ON public.toppers(year DESC, exam, rank);

-- Seed a few well-known toppers so the page isn't empty
INSERT INTO public.toppers (year, exam, rank, name, city, state, marks, notes) VALUES
  (2024, 'jee_advanced', 1, 'Ved Lahoti', 'Indore', 'Madhya Pradesh', '355/360', 'JEE Advanced 2024 AIR 1'),
  (2024, 'jee_advanced', 2, 'Aditya', 'Delhi', 'Delhi', '346/360', 'JEE Advanced 2024 AIR 2'),
  (2024, 'jee_main', 1, 'Nandesh Kumar', 'Andhra Pradesh', 'Andhra Pradesh', '300/300', 'JEE Main 2024 100 percentile'),
  (2024, 'neet', 1, 'Soyeb Aftab', 'Rourkela', 'Odisha', '720/720', 'Historical benchmark'),
  (2025, 'jee_advanced', 1, 'Rajit Gupta', 'Kota', 'Rajasthan', '332/360', 'JEE Advanced 2025 AIR 1')
ON CONFLICT DO NOTHING;
