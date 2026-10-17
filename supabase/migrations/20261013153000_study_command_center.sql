-- Study Command Center enhancements.
-- Extends the existing user_daily_targets table and adds user-owned goals.
ALTER TABLE public.user_daily_targets
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high'));

ALTER TABLE public.user_daily_targets
  ADD COLUMN IF NOT EXISTS estimated_minutes integer
    CHECK (estimated_minutes IS NULL OR estimated_minutes BETWEEN 1 AND 1440);

CREATE INDEX IF NOT EXISTS user_daily_targets_user_date_done_idx
  ON public.user_daily_targets(user_id, task_date, done);

CREATE TABLE IF NOT EXISTS public.study_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 120),
  target_value integer NOT NULL DEFAULT 1 CHECK (target_value BETWEEN 1 AND 100000),
  current_value integer NOT NULL DEFAULT 0 CHECK (current_value BETWEEN 0 AND target_value),
  goal_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_goals TO authenticated;
GRANT ALL ON public.study_goals TO service_role;
ALTER TABLE public.study_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own study goals" ON public.study_goals;
CREATE POLICY "Users view own study goals" ON public.study_goals
  FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users insert own study goals" ON public.study_goals;
CREATE POLICY "Users insert own study goals" ON public.study_goals
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users update own study goals" ON public.study_goals;
CREATE POLICY "Users update own study goals" ON public.study_goals
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users delete own study goals" ON public.study_goals;
CREATE POLICY "Users delete own study goals" ON public.study_goals
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS study_goals_user_date_idx
  ON public.study_goals(user_id, goal_date DESC);

DROP TRIGGER IF EXISTS study_goals_touch_updated ON public.study_goals;
CREATE TRIGGER study_goals_touch_updated BEFORE UPDATE ON public.study_goals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
