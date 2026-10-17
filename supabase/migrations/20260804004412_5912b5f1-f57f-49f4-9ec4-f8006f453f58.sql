ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS topic text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_ai boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS solved_at timestamptz;

CREATE INDEX IF NOT EXISTS chat_messages_kind_created_idx ON public.chat_messages (kind, created_at DESC);
CREATE INDEX IF NOT EXISTS chat_messages_parent_idx ON public.chat_messages (parent_id, created_at);

CREATE TABLE IF NOT EXISTS public.chat_reads (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.chat_reads TO authenticated;
GRANT ALL ON public.chat_reads TO service_role;
ALTER TABLE public.chat_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_reads own select" ON public.chat_reads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "chat_reads own insert" ON public.chat_reads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_reads own update" ON public.chat_reads FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER chat_reads_touch BEFORE UPDATE ON public.chat_reads
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.community_ai_settings (
  id integer PRIMARY KEY DEFAULT 1,
  auto_answer_doubts boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT community_ai_settings_singleton CHECK (id = 1)
);

GRANT SELECT ON public.community_ai_settings TO authenticated;
GRANT ALL ON public.community_ai_settings TO service_role;
ALTER TABLE public.community_ai_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai settings readable" ON public.community_ai_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai settings admin write" ON public.community_ai_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.community_ai_settings (id, auto_answer_doubts) VALUES (1, false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "chat media read" ON storage.objects FOR SELECT USING (bucket_id = 'chat-media');
CREATE POLICY "chat media upload own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-media' AND NOT public.is_guest_session() AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "chat media delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'chat-media' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));