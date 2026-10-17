
-- Catalog of certificate types
CREATE TABLE public.certificate_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('membership','streak','hours','mastery','custom')),
  threshold INTEGER,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.certificate_types TO anon, authenticated;
GRANT ALL ON public.certificate_types TO service_role;
ALTER TABLE public.certificate_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view certificate types" ON public.certificate_types FOR SELECT USING (true);
CREATE POLICY "Admins manage certificate types" ON public.certificate_types FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Earned certificates per user
CREATE TABLE public.user_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_type_id UUID REFERENCES public.certificate_types(id) ON DELETE SET NULL,
  custom_title TEXT,
  custom_description TEXT,
  verification_code TEXT NOT NULL UNIQUE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  awarded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (user_id, certificate_type_id)
);
GRANT SELECT ON public.user_certificates TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.user_certificates TO authenticated;
GRANT ALL ON public.user_certificates TO service_role;
ALTER TABLE public.user_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view earned certificates" ON public.user_certificates FOR SELECT USING (true);
CREATE POLICY "Users insert their own auto-earned certificates" ON public.user_certificates FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND certificate_type_id IS NOT NULL
    AND custom_title IS NULL
    AND awarded_by IS NULL
  );
CREATE POLICY "Admins insert any certificate" ON public.user_certificates FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete certificates" ON public.user_certificates FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX user_certificates_user_idx ON public.user_certificates(user_id);

-- Daily checklist
CREATE TABLE public.daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_date DATE NOT NULL,
  studied BOOLEAN NOT NULL DEFAULT false,
  practiced BOOLEAN NOT NULL DEFAULT false,
  revised BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, task_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_tasks TO authenticated;
GRANT ALL ON public.daily_tasks TO service_role;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own tasks" ON public.daily_tasks FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own tasks" ON public.daily_tasks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own tasks" ON public.daily_tasks FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own tasks" ON public.daily_tasks FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX daily_tasks_user_date_idx ON public.daily_tasks(user_id, task_date DESC);

CREATE TRIGGER daily_tasks_touch_updated BEFORE UPDATE ON public.daily_tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed catalog
INSERT INTO public.certificate_types (code, name, description, category, threshold, icon, sort_order) VALUES
  ('community_member_30', 'Community Member', 'Active member of JEE Prep Hub for 30 days', 'membership', 30, 'Users', 10),
  ('streak_7',  '7-Day Streak',   'Completed the daily checklist 7 days in a row',   'streak', 7,   'Flame', 20),
  ('streak_30', '30-Day Streak',  'Completed the daily checklist 30 days in a row',  'streak', 30,  'Flame', 21),
  ('streak_100','100-Day Streak', 'Completed the daily checklist 100 days in a row', 'streak', 100, 'Flame', 22),
  ('hours_50',  '50 Study Hours',  'Logged 50 focused study hours',  'hours', 50,  'Clock', 30),
  ('hours_100', '100 Study Hours', 'Logged 100 focused study hours', 'hours', 100, 'Clock', 31),
  ('hours_500', '500 Study Hours', 'Logged 500 focused study hours', 'hours', 500, 'Clock', 32),
  ('mastery_physics',   'Physics Mastery',   'Completed all Physics topics',   'mastery', NULL, 'Atom',     40),
  ('mastery_chemistry', 'Chemistry Mastery', 'Completed all Chemistry topics', 'mastery', NULL, 'FlaskConical', 41),
  ('mastery_math',      'Math Mastery',      'Completed all Math topics',      'mastery', NULL, 'Sigma',    42);
