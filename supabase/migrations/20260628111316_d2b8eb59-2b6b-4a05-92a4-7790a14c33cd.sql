CREATE TABLE public.streak_recoveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recovered_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, recovered_date)
);

GRANT SELECT, INSERT, DELETE ON public.streak_recoveries TO authenticated;
GRANT ALL ON public.streak_recoveries TO service_role;

ALTER TABLE public.streak_recoveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own recoveries" ON public.streak_recoveries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own recoveries" ON public.streak_recoveries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own recoveries" ON public.streak_recoveries
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_streak_recoveries_user_date ON public.streak_recoveries(user_id, recovered_date DESC);