-- Durable WhatsApp-style manual read/unread state for Squad conversations.
-- Existing message read_at / group member last_read_at fields remain the source
-- of truth for automatic read receipts; this table stores an explicit manual
-- unread override without creating duplicate messages or memberships.
CREATE TABLE IF NOT EXISTS public.squad_conversation_states (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_type text NOT NULL CHECK (conversation_type IN ('dm', 'group')),
  conversation_id uuid NOT NULL,
  marked_unread boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, conversation_type, conversation_id)
);

CREATE INDEX IF NOT EXISTS squad_conversation_states_user_idx
  ON public.squad_conversation_states (user_id, updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.squad_conversation_states TO authenticated;
GRANT ALL ON public.squad_conversation_states TO service_role;

ALTER TABLE public.squad_conversation_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read their Squad conversation states" ON public.squad_conversation_states;
CREATE POLICY "Users read their Squad conversation states"
  ON public.squad_conversation_states FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert their Squad conversation states" ON public.squad_conversation_states;
CREATE POLICY "Users insert their Squad conversation states"
  ON public.squad_conversation_states FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update their Squad conversation states" ON public.squad_conversation_states;
CREATE POLICY "Users update their Squad conversation states"
  ON public.squad_conversation_states FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete their Squad conversation states" ON public.squad_conversation_states;
CREATE POLICY "Users delete their Squad conversation states"
  ON public.squad_conversation_states FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.squad_conversation_states;
ALTER TABLE public.squad_conversation_states REPLICA IDENTITY FULL;
