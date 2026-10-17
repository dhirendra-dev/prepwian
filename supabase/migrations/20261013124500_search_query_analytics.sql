-- Search analytics stores submitted searches only (never every keystroke).
-- It intentionally stores no IP address, user agent, email, or search result contents.
CREATE TABLE IF NOT EXISTS public.search_query_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL CHECK (char_length(query) BETWEEN 2 AND 120),
  visitor_id text NOT NULL CHECK (char_length(visitor_id) BETWEEN 16 AND 100),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'home' CHECK (source IN ('home', 'menu', 'notes')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS search_query_events_created_at_idx
  ON public.search_query_events (created_at DESC);
CREATE INDEX IF NOT EXISTS search_query_events_query_idx
  ON public.search_query_events (query, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.search_query_events;

ALTER TABLE public.search_query_events ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON public.search_query_events TO anon, authenticated;
GRANT SELECT ON public.search_query_events TO authenticated;

DROP POLICY IF EXISTS "Anyone can record a submitted search" ON public.search_query_events;
CREATE POLICY "Anyone can record a submitted search"
  ON public.search_query_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(query) BETWEEN 2 AND 120
    AND char_length(visitor_id) BETWEEN 16 AND 100
    AND (user_id IS NULL OR user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can view search analytics" ON public.search_query_events;
CREATE POLICY "Admins can view search analytics"
  ON public.search_query_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.admin_search_query_analytics(
  p_days integer DEFAULT 30,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  query text,
  searches bigint,
  unique_visitors bigint,
  last_searched_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT e.query,
         count(*)::bigint AS searches,
         count(DISTINCT e.visitor_id)::bigint AS unique_visitors,
         max(e.created_at) AS last_searched_at
  FROM public.search_query_events e
  WHERE public.has_role(auth.uid(), 'admin')
    AND e.created_at >= now() - make_interval(days => least(greatest(coalesce(p_days, 30), 1), 90))
  GROUP BY e.query
  ORDER BY count(*) DESC, max(e.created_at) DESC
  LIMIT least(greatest(coalesce(p_limit, 50), 1), 200);
$$;

CREATE OR REPLACE FUNCTION public.admin_search_query_metrics(p_days integer DEFAULT 30)
RETURNS TABLE (
  total_searches bigint,
  unique_queries bigint,
  unique_visitors bigint,
  searches_24h bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT count(*)::bigint,
         count(DISTINCT e.query)::bigint,
         count(DISTINCT e.visitor_id)::bigint,
         count(*) FILTER (WHERE e.created_at >= now() - interval '24 hours')::bigint
  FROM public.search_query_events e
  WHERE public.has_role(auth.uid(), 'admin')
    AND e.created_at >= now() - make_interval(days => least(greatest(coalesce(p_days, 30), 1), 90));
$$;

REVOKE ALL ON FUNCTION public.admin_search_query_analytics(integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_search_query_analytics(integer, integer) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_search_query_metrics(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_search_query_metrics(integer) TO authenticated;
