-- Persist WhatsApp-style reactions for private and Squad messages.
CREATE TABLE IF NOT EXISTS public.direct_message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.direct_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL CHECK (char_length(emoji) <= 16),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS public.study_group_message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.study_group_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL CHECK (char_length(emoji) <= 16),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS direct_message_reactions_message_idx
  ON public.direct_message_reactions(message_id);
CREATE INDEX IF NOT EXISTS study_group_message_reactions_message_idx
  ON public.study_group_message_reactions(message_id);

GRANT SELECT, INSERT, DELETE ON public.direct_message_reactions TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.study_group_message_reactions TO authenticated;

ALTER TABLE public.direct_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS direct_message_reactions_read ON public.direct_message_reactions;
CREATE POLICY direct_message_reactions_read ON public.direct_message_reactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.direct_messages m
      WHERE m.id = message_id AND (m.sender_id = auth.uid() OR m.recipient_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS direct_message_reactions_insert_own ON public.direct_message_reactions;
CREATE POLICY direct_message_reactions_insert_own ON public.direct_message_reactions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.direct_messages m
      WHERE m.id = message_id AND (m.sender_id = auth.uid() OR m.recipient_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS direct_message_reactions_delete_own ON public.direct_message_reactions;
CREATE POLICY direct_message_reactions_delete_own ON public.direct_message_reactions
  FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS study_group_message_reactions_read ON public.study_group_message_reactions;
CREATE POLICY study_group_message_reactions_read ON public.study_group_message_reactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.study_group_messages m
      JOIN public.group_members gm ON gm.group_id = m.group_id
      WHERE m.id = message_id AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS study_group_message_reactions_insert_own ON public.study_group_message_reactions;
CREATE POLICY study_group_message_reactions_insert_own ON public.study_group_message_reactions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.study_group_messages m
      JOIN public.group_members gm ON gm.group_id = m.group_id
      WHERE m.id = message_id AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS study_group_message_reactions_delete_own ON public.study_group_message_reactions;
CREATE POLICY study_group_message_reactions_delete_own ON public.study_group_message_reactions
  FOR DELETE TO authenticated USING (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_group_message_reactions;
