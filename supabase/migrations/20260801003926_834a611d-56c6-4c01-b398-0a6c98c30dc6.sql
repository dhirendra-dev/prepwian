-- 1) Hide answer-key columns from the Data API (column-level grants)
REVOKE SELECT ON public.test_questions FROM anon, authenticated;
GRANT SELECT (id, test_id, order_no, question_type, question_text, image_url, subject, chapter, marks, negative_marks, explanation, numerical_tolerance, created_at, updated_at)
  ON public.test_questions TO anon, authenticated;

REVOKE SELECT ON public.test_options FROM anon, authenticated;
GRANT SELECT (id, question_id, label, text, order_no, created_at)
  ON public.test_options TO anon, authenticated;

GRANT ALL ON public.test_questions TO service_role;
GRANT ALL ON public.test_options TO service_role;

-- 2) Admin-granted permission to use the platform AI (no personal API key needed)
CREATE TABLE IF NOT EXISTS public.test_ai_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  granted_by uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.test_ai_access TO authenticated;
GRANT ALL ON public.test_ai_access TO service_role;

ALTER TABLE public.test_ai_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own or admin can read ai access" ON public.test_ai_access
FOR SELECT TO authenticated
USING (
  COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
);

CREATE TRIGGER trg_test_ai_access_touch
BEFORE UPDATE ON public.test_ai_access
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();