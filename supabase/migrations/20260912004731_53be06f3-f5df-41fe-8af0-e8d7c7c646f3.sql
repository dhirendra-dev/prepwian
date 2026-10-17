CREATE TABLE IF NOT EXISTS public.rate_limits (
  bucket text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON public.rate_limits FROM anon, authenticated;
GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(_bucket text, _limit integer, _window_seconds integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.rate_limits;
  now_ts timestamptz := now();
BEGIN
  INSERT INTO public.rate_limits AS rl (bucket, window_start, count, updated_at)
  VALUES (_bucket, now_ts, 1, now_ts)
  ON CONFLICT (bucket) DO UPDATE SET
    count = CASE WHEN rl.window_start < now_ts - make_interval(secs => _window_seconds) THEN 1 ELSE rl.count + 1 END,
    window_start = CASE WHEN rl.window_start < now_ts - make_interval(secs => _window_seconds) THEN now_ts ELSE rl.window_start END,
    updated_at = now_ts
  RETURNING * INTO r;

  IF random() < 0.01 THEN
    DELETE FROM public.rate_limits WHERE updated_at < now_ts - interval '1 day';
  END IF;

  RETURN jsonb_build_object(
    'allowed', r.count <= _limit,
    'count', r.count,
    'limit', _limit,
    'retry_after', GREATEST(1, CEIL(EXTRACT(epoch FROM (r.window_start + make_interval(secs => _window_seconds) - now_ts)))::int)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) TO service_role;

CREATE TABLE IF NOT EXISTS public.server_security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  action text,
  ip_hash text,
  user_id uuid,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS server_security_events_created_idx ON public.server_security_events (created_at DESC);

REVOKE ALL ON public.server_security_events FROM anon, authenticated;
GRANT SELECT ON public.server_security_events TO authenticated;
GRANT ALL ON public.server_security_events TO service_role;
ALTER TABLE public.server_security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read server security events" ON public.server_security_events;
CREATE POLICY "Admins read server security events"
ON public.server_security_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));