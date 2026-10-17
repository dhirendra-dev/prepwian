-- Allow authors to edit/delete their own private and squad messages.
-- Existing rows remain intact; deletion is represented as a soft-deleted message.

ALTER TABLE public.direct_messages
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_for_everyone boolean NOT NULL DEFAULT false;

GRANT DELETE ON public.direct_messages TO authenticated;

DROP POLICY IF EXISTS "dm sender deletes own" ON public.direct_messages;
CREATE POLICY "dm sender deletes own"
  ON public.direct_messages FOR DELETE TO authenticated
  USING (auth.uid() = sender_id);

DROP POLICY IF EXISTS "dm sender edits own" ON public.direct_messages;
CREATE POLICY "dm sender edits own"
  ON public.direct_messages FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = sender_id OR auth.uid() = recipient_id);

ALTER TABLE public.study_group_messages
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_for_everyone boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Squad senders can edit messages" ON public.study_group_messages;
CREATE POLICY "Squad senders can edit messages"
  ON public.study_group_messages FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_squad_admin(group_id, auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_squad_admin(group_id, auth.uid())
  );
