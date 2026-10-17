CREATE TABLE public.leaderboard_weekly_totals (
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  total_seconds bigint NOT NULL DEFAULT 0 CHECK (total_seconds >= 0),
  session_count integer NOT NULL DEFAULT 0 CHECK (session_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, week_start)
);

GRANT SELECT ON public.leaderboard_weekly_totals TO anon, authenticated;
GRANT ALL ON public.leaderboard_weekly_totals TO service_role;

ALTER TABLE public.leaderboard_weekly_totals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Weekly leaderboard totals are public"
ON public.leaderboard_weekly_totals
FOR SELECT
TO anon, authenticated
USING (true);

CREATE OR REPLACE FUNCTION public.sync_weekly_leaderboard_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_user uuid;
  affected_week date;
BEGIN
  affected_user := COALESCE(NEW.user_id, OLD.user_id);
  affected_week := date_trunc('week', COALESCE(NEW.ended_at, OLD.ended_at) AT TIME ZONE 'Asia/Kolkata')::date;

  INSERT INTO public.leaderboard_weekly_totals (user_id, week_start, total_seconds, session_count, updated_at)
  SELECT
    affected_user,
    affected_week,
    COALESCE(SUM(duration_seconds), 0)::bigint,
    COUNT(*)::integer,
    now()
  FROM public.study_sessions
  WHERE user_id = affected_user
    AND date_trunc('week', ended_at AT TIME ZONE 'Asia/Kolkata')::date = affected_week
  ON CONFLICT (user_id, week_start)
  DO UPDATE SET
    total_seconds = EXCLUDED.total_seconds,
    session_count = EXCLUDED.session_count,
    updated_at = now();

  IF TG_OP = 'UPDATE'
     AND (OLD.user_id, date_trunc('week', OLD.ended_at AT TIME ZONE 'Asia/Kolkata')::date)
         IS DISTINCT FROM
         (NEW.user_id, date_trunc('week', NEW.ended_at AT TIME ZONE 'Asia/Kolkata')::date) THEN
    INSERT INTO public.leaderboard_weekly_totals (user_id, week_start, total_seconds, session_count, updated_at)
    SELECT
      OLD.user_id,
      date_trunc('week', OLD.ended_at AT TIME ZONE 'Asia/Kolkata')::date,
      COALESCE(SUM(duration_seconds), 0)::bigint,
      COUNT(*)::integer,
      now()
    FROM public.study_sessions
    WHERE user_id = OLD.user_id
      AND date_trunc('week', ended_at AT TIME ZONE 'Asia/Kolkata')::date = date_trunc('week', OLD.ended_at AT TIME ZONE 'Asia/Kolkata')::date
    ON CONFLICT (user_id, week_start)
    DO UPDATE SET
      total_seconds = EXCLUDED.total_seconds,
      session_count = EXCLUDED.session_count,
      updated_at = now();
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_weekly_leaderboard_total() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_weekly_leaderboard_total() TO service_role;

CREATE TRIGGER trg_sync_weekly_leaderboard_total
AFTER INSERT OR UPDATE OR DELETE ON public.study_sessions
FOR EACH ROW EXECUTE FUNCTION public.sync_weekly_leaderboard_total();

INSERT INTO public.leaderboard_weekly_totals (user_id, week_start, total_seconds, session_count, updated_at)
SELECT
  user_id,
  date_trunc('week', ended_at AT TIME ZONE 'Asia/Kolkata')::date,
  SUM(duration_seconds)::bigint,
  COUNT(*)::integer,
  now()
FROM public.study_sessions
GROUP BY user_id, date_trunc('week', ended_at AT TIME ZONE 'Asia/Kolkata')::date
ON CONFLICT (user_id, week_start)
DO UPDATE SET
  total_seconds = EXCLUDED.total_seconds,
  session_count = EXCLUDED.session_count,
  updated_at = now();

ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard_weekly_totals;

CREATE OR REPLACE FUNCTION public.study_totals_since(_since timestamptz)
RETURNS TABLE(user_id uuid, total_seconds bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT s.user_id, COALESCE(SUM(s.duration_seconds), 0)::bigint
  FROM public.study_sessions s
  WHERE s.ended_at >= _since
    AND s.user_id = auth.uid()
  GROUP BY s.user_id;
$$;

REVOKE ALL ON FUNCTION public.study_totals_since(timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.study_totals_since(timestamptz) TO authenticated, service_role;