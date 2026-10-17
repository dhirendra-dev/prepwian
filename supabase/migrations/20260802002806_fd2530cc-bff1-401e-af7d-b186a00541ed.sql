-- Admin/owner policies must not be evaluated for anonymous visitors: they call
-- has_role(), which anon may not execute, and that turns every anon SELECT into an error.
ALTER POLICY "tests_admin_all" ON public.tests TO authenticated;
ALTER POLICY "tests_owner_insert" ON public.tests TO authenticated;
ALTER POLICY "tests_owner_read" ON public.tests TO authenticated;
ALTER POLICY "tests_owner_update_draft" ON public.tests TO authenticated;
ALTER POLICY "test_questions_admin_all" ON public.test_questions TO authenticated;
ALTER POLICY "test_questions_owner_write" ON public.test_questions TO authenticated;
ALTER POLICY "test_options_admin_all" ON public.test_options TO authenticated;
ALTER POLICY "test_options_owner_write" ON public.test_options TO authenticated;
ALTER POLICY "attempts_admin_read" ON public.test_attempts TO authenticated;
ALTER POLICY "reports_admin_read" ON public.test_reports TO authenticated;
ALTER POLICY "pdf_admin_all" ON public.test_pdf_uploads TO authenticated;
ALTER POLICY "chat update own or admin" ON public.chat_messages TO authenticated;
ALTER POLICY "Squad admins can update member roles" ON public.study_group_members TO authenticated;
ALTER POLICY "Squad admins can remove members" ON public.study_group_members TO authenticated;
ALTER POLICY "Senders, owners and squad admins delete messages" ON public.study_group_messages TO authenticated;
ALTER POLICY "Admins can view all consents" ON public.user_consents TO authenticated;

-- Split anon-visible read policies so the anon variant never calls has_role().
DROP POLICY IF EXISTS "test_questions_read" ON public.test_questions;
CREATE POLICY "test_questions_read_anon" ON public.test_questions FOR SELECT TO anon
USING (EXISTS (SELECT 1 FROM public.tests t WHERE t.id = test_questions.test_id
  AND t.visibility = 'public' AND t.status = ANY (ARRAY['published'::test_status,'scheduled'::test_status])));
CREATE POLICY "test_questions_read_auth" ON public.test_questions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.tests t WHERE t.id = test_questions.test_id
  AND ((t.visibility = 'public' AND t.status = ANY (ARRAY['published'::test_status,'scheduled'::test_status]))
    OR t.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

DROP POLICY IF EXISTS "test_options_read" ON public.test_options;
CREATE POLICY "test_options_read_anon" ON public.test_options FOR SELECT TO anon
USING (EXISTS (SELECT 1 FROM public.test_questions q JOIN public.tests t ON t.id = q.test_id
  WHERE q.id = test_options.question_id
    AND t.visibility = 'public' AND t.status = ANY (ARRAY['published'::test_status,'scheduled'::test_status])));
CREATE POLICY "test_options_read_auth" ON public.test_options FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.test_questions q JOIN public.tests t ON t.id = q.test_id
  WHERE q.id = test_options.question_id
    AND ((t.visibility = 'public' AND t.status = ANY (ARRAY['published'::test_status,'scheduled'::test_status]))
      OR t.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

DROP POLICY IF EXISTS "profiles readable, guests hidden" ON public.profiles;
CREATE POLICY "profiles readable to visitors, guests hidden" ON public.profiles FOR SELECT TO anon
USING (is_guest IS NOT TRUE);
CREATE POLICY "profiles readable to members, guests hidden" ON public.profiles FOR SELECT TO authenticated
USING (is_guest IS NOT TRUE OR id = auth.uid() OR public.has_role(auth.uid(), 'admin'));