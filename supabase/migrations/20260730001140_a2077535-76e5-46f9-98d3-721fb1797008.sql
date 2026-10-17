DROP POLICY IF EXISTS tests_public_read ON public.tests;
CREATE POLICY tests_public_read ON public.tests
FOR SELECT
TO anon, authenticated
USING (
  visibility = 'public'::test_visibility
  AND status IN ('published'::test_status, 'scheduled'::test_status)
);

DROP POLICY IF EXISTS test_questions_read ON public.test_questions;
CREATE POLICY test_questions_read ON public.test_questions
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tests t
    WHERE t.id = test_questions.test_id
      AND (
        (t.visibility = 'public'::test_visibility AND t.status IN ('published'::test_status, 'scheduled'::test_status))
        OR t.created_by = auth.uid()
        OR public.has_role(auth.uid(), 'admin'::app_role)
      )
  )
);

DROP POLICY IF EXISTS test_options_read ON public.test_options;
CREATE POLICY test_options_read ON public.test_options
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.test_questions q
    JOIN public.tests t ON t.id = q.test_id
    WHERE q.id = test_options.question_id
      AND (
        (t.visibility = 'public'::test_visibility AND t.status IN ('published'::test_status, 'scheduled'::test_status))
        OR t.created_by = auth.uid()
        OR public.has_role(auth.uid(), 'admin'::app_role)
      )
  )
);