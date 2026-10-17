-- FOLLOWS
CREATE TABLE public.follows (
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows readable by all signed in" ON public.follows
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "follow self only" ON public.follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "unfollow self only" ON public.follows
  FOR DELETE TO authenticated USING (auth.uid() = follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

-- DIRECT MESSAGES
CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 4000),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (sender_id <> recipient_id)
);
GRANT SELECT, INSERT, UPDATE ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dm participants can read" ON public.direct_messages
  FOR SELECT TO authenticated
  USING (auth.uid() IN (sender_id, recipient_id));
CREATE POLICY "dm send as self" ON public.direct_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "dm recipient marks read" ON public.direct_messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);
CREATE INDEX idx_dm_pair_time ON public.direct_messages(sender_id, recipient_id, created_at DESC);
CREATE INDEX idx_dm_recipient_unread ON public.direct_messages(recipient_id) WHERE read_at IS NULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- Conversation list helper: latest message per peer for the calling user
CREATE OR REPLACE FUNCTION public.list_dm_conversations()
RETURNS TABLE (
  peer_id uuid,
  last_message text,
  last_at timestamptz,
  last_sender uuid,
  unread int
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  WITH me AS (SELECT auth.uid() AS uid),
  msgs AS (
    SELECT
      CASE WHEN dm.sender_id = (SELECT uid FROM me) THEN dm.recipient_id ELSE dm.sender_id END AS peer_id,
      dm.body, dm.created_at, dm.sender_id, dm.recipient_id, dm.read_at
    FROM public.direct_messages dm
    WHERE (SELECT uid FROM me) IN (dm.sender_id, dm.recipient_id)
  ),
  ranked AS (
    SELECT m.*, row_number() OVER (PARTITION BY peer_id ORDER BY created_at DESC) AS rn
    FROM msgs m
  )
  SELECT
    r.peer_id,
    r.body AS last_message,
    r.created_at AS last_at,
    r.sender_id AS last_sender,
    (SELECT count(*)::int FROM msgs x
       WHERE x.peer_id = r.peer_id AND x.recipient_id = (SELECT uid FROM me) AND x.read_at IS NULL) AS unread
  FROM ranked r
  WHERE rn = 1
  ORDER BY r.created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.list_dm_conversations() TO authenticated;