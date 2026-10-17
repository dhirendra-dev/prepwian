
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS pinned_at timestamptz,
  ADD COLUMN IF NOT EXISTS pinned_by uuid,
  ADD COLUMN IF NOT EXISTS marked_at timestamptz,
  ADD COLUMN IF NOT EXISTS marked_by uuid,
  ADD COLUMN IF NOT EXISTS marked_label text;

DROP POLICY IF EXISTS "chat update own" ON public.chat_messages;
CREATE POLICY "chat update own or admin" ON public.chat_messages
  FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
