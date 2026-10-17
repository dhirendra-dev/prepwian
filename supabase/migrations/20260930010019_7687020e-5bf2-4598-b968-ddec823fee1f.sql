CREATE TABLE public.weekly_winners (
  week_start date PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_seconds bigint NOT NULL,
  pro_expires_at timestamptz,
  finalized_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.weekly_winners TO anon, authenticated;
GRANT ALL ON public.weekly_winners TO service_role;
ALTER TABLE public.weekly_winners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Winner history is public" ON public.weekly_winners FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.finalize_weekly_winners()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cur_week date := date_trunc('week', now() AT TIME ZONE 'Asia/Kolkata')::date;
  w record; winner record; n integer := 0; exp timestamptz;
BEGIN
  FOR w IN
    SELECT DISTINCT t.week_start FROM public.leaderboard_weekly_totals t
    WHERE t.week_start < cur_week AND t.total_seconds > 0
      AND NOT EXISTS (SELECT 1 FROM public.weekly_winners x WHERE x.week_start = t.week_start)
    ORDER BY t.week_start
  LOOP
    SELECT user_id, total_seconds INTO winner FROM public.leaderboard_weekly_totals
    WHERE week_start = w.week_start AND total_seconds > 0
    ORDER BY total_seconds DESC, updated_at ASC LIMIT 1;
    exp := NULL;
    -- Only award Pro for the most recently completed week (7 days from week end)
    IF w.week_start = cur_week - 7 THEN
      exp := ((cur_week + 7)::timestamp AT TIME ZONE 'Asia/Kolkata');
      INSERT INTO public.pro_subscriptions (user_id, plan, status, expires_at, note)
      VALUES (winner.user_id, 'trial', 'active', exp, 'Weekly leaderboard #1 for week of ' || w.week_start);
    END IF;
    INSERT INTO public.weekly_winners (week_start, user_id, total_seconds, pro_expires_at)
    VALUES (w.week_start, winner.user_id, winner.total_seconds, exp)
    ON CONFLICT DO NOTHING;
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;
REVOKE EXECUTE ON FUNCTION public.finalize_weekly_winners() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.finalize_weekly_winners() TO authenticated, service_role;