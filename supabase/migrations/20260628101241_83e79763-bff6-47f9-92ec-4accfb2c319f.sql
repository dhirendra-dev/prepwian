
CREATE TABLE public.polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location text NOT NULL CHECK (location IN ('community','notice')),
  question text NOT NULL,
  options jsonb NOT NULL,
  multi boolean NOT NULL DEFAULT false,
  closes_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.polls TO authenticated;
GRANT SELECT ON public.polls TO anon;
GRANT ALL ON public.polls TO service_role;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "polls readable by all" ON public.polls FOR SELECT USING (true);
CREATE POLICY "auth can create community polls" ON public.polls FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (location = 'community' OR public.has_role(auth.uid(), 'admin'))
  );
CREATE POLICY "creator or admin can delete poll" ON public.polls FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "creator or admin can update poll" ON public.polls FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.poll_votes (
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (poll_id, user_id, option_id)
);
GRANT SELECT, INSERT, DELETE ON public.poll_votes TO authenticated;
GRANT SELECT ON public.poll_votes TO anon;
GRANT ALL ON public.poll_votes TO service_role;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "votes readable by all" ON public.poll_votes FOR SELECT USING (true);
CREATE POLICY "user can cast own vote" ON public.poll_votes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "user can retract own vote" ON public.poll_votes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.polls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;

CREATE INDEX poll_votes_poll_idx ON public.poll_votes(poll_id);
CREATE INDEX polls_location_created_idx ON public.polls(location, created_at DESC);
