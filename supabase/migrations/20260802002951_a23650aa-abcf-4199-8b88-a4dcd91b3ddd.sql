DROP POLICY IF EXISTS "chat public read" ON public.chat_messages;
CREATE POLICY "chat members read" ON public.chat_messages FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.chat_messages FROM anon;