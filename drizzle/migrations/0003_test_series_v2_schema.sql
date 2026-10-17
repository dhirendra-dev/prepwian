ALTER TYPE public.test_question_type ADD VALUE IF NOT EXISTS 'range';

ALTER TABLE public.test_questions
  ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS solution_images jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS topic text,
  ADD COLUMN IF NOT EXISTS difficulty text,
  ADD COLUMN IF NOT EXISTS exam_category text,
  ADD COLUMN IF NOT EXISTS section text,
  ADD COLUMN IF NOT EXISTS range_min numeric,
  ADD COLUMN IF NOT EXISTS range_max numeric,
  ADD COLUMN IF NOT EXISTS partial_marking text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS unanswered_marks numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

ALTER TABLE public.test_questions DROP CONSTRAINT IF EXISTS test_questions_partial_marking_chk;
ALTER TABLE public.test_questions ADD CONSTRAINT test_questions_partial_marking_chk CHECK (partial_marking IN ('none','jee_advanced','proportional'));

ALTER TABLE public.test_options ADD COLUMN IF NOT EXISTS image_path text;

ALTER TABLE public.tests
  ADD COLUMN IF NOT EXISTS sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS navigation_mode text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS solution_visibility text NOT NULL DEFAULT 'after_submit';
ALTER TABLE public.tests DROP CONSTRAINT IF EXISTS tests_navigation_mode_chk;
ALTER TABLE public.tests ADD CONSTRAINT tests_navigation_mode_chk CHECK (navigation_mode IN ('free','section_locked'));
ALTER TABLE public.tests DROP CONSTRAINT IF EXISTS tests_solution_visibility_chk;
ALTER TABLE public.tests ADD CONSTRAINT tests_solution_visibility_chk CHECK (solution_visibility IN ('after_submit','after_end','never'));

CREATE INDEX IF NOT EXISTS test_questions_test_active_idx ON public.test_questions (test_id, order_no) WHERE archived_at IS NULL;

DROP POLICY IF EXISTS "test_images_admin_select" ON storage.objects;
DROP POLICY IF EXISTS "test_images_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "test_images_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "test_images_admin_delete" ON storage.objects;
CREATE POLICY "test_images_admin_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'test-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "test_images_admin_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'test-images' AND public.has_role(auth.uid(), 'admin') AND lower(storage.extension(name)) IN ('png','jpg','jpeg','webp','gif','svg'));
CREATE POLICY "test_images_admin_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'test-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "test_images_admin_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'test-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can read category rules" ON public.jee_category_rules;
CREATE POLICY "Admins can read category rules" ON public.jee_category_rules FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Authenticated users can view alumni profiles" ON public.jee_alumni_profiles;
CREATE POLICY "Admins can view alumni profiles" ON public.jee_alumni_profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Authenticated users can read living cost components" ON public.jee_living_cost_components;
CREATE POLICY "Admins can read living cost components" ON public.jee_living_cost_components FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));