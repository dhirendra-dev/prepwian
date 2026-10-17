
CREATE TABLE public.chat_message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

GRANT SELECT, INSERT, DELETE ON public.chat_message_reactions TO authenticated;
GRANT ALL ON public.chat_message_reactions TO service_role;

ALTER TABLE public.chat_message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reactions are viewable by authenticated users"
  ON public.chat_message_reactions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can add their own reactions"
  ON public.chat_message_reactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions"
  ON public.chat_message_reactions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX chat_message_reactions_message_id_idx ON public.chat_message_reactions(message_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_message_reactions;
