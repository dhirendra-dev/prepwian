CREATE TABLE public.user_daily_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_date date NOT NULL,
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 200),
  done boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_daily_targets TO authenticated;
GRANT ALL ON public.user_daily_targets TO service_role;

ALTER TABLE public.user_daily_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own targets select" ON public.user_daily_targets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own targets insert" ON public.user_daily_targets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own targets update" ON public.user_daily_targets
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own targets delete" ON public.user_daily_targets
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_user_daily_targets_user_date ON public.user_daily_targets(user_id, task_date);

CREATE TRIGGER touch_user_daily_targets
  BEFORE UPDATE ON public.user_daily_targets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();