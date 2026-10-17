-- PULSE FEED + VIDEO LECTURES + SCHEDULED TESTS
-- Existing community feed reuse notes (verified, do not duplicate):
--   posts table:    public.feed_posts (id, user_id, body, image_url, created_at, source_profile_post_id)
--   likes:          public.feed_likes (user_id, target_type 'post'|'comment', target_id)
--   comments:       public.feed_comments (id, post_id, user_id, body, created_at)
--   authors:        public.profiles (id, full_name, avatar_url)
--   admin check:    public.has_role(auth.uid(), 'admin')
-- ROLLBACK (manual): drop view public.pulse_feed_items; drop function public.increment_video_view(uuid);
--   drop table public.video_lectures; drop table public.scheduled_tests; delete from public.app_settings where id = 1;

CREATE TABLE IF NOT EXISTS public.video_lectures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  youtube_video_id text NOT NULL CHECK (char_length(youtube_video_id) = 11),
  subject text NOT NULL CHECK (subject IN ('Physics','Chemistry','Mathematics')),
  chapter text NOT NULL,
  description text,
  duration_minutes integer CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  added_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_published boolean NOT NULL DEFAULT true,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.video_lectures TO authenticated;
GRANT SELECT ON public.video_lectures TO anon;
GRANT INSERT, UPDATE, DELETE ON public.video_lectures TO authenticated;
GRANT ALL ON public.video_lectures TO service_role;

ALTER TABLE public.video_lectures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "video_lectures_select_published" ON public.video_lectures
  FOR SELECT TO authenticated USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "video_lectures_select_published_anon" ON public.video_lectures
  FOR SELECT TO anon USING (is_published = true);
CREATE POLICY "video_lectures_admin_insert" ON public.video_lectures
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "video_lectures_admin_update" ON public.video_lectures
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "video_lectures_admin_delete" ON public.video_lectures
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS video_lectures_feed_idx ON public.video_lectures (is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS video_lectures_subject_chapter_idx ON public.video_lectures (subject, chapter);

CREATE TRIGGER video_lectures_touch BEFORE UPDATE ON public.video_lectures
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.increment_video_view(video_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.video_lectures SET view_count = view_count + 1 WHERE id = video_id AND is_published = true;
$$;

REVOKE ALL ON FUNCTION public.increment_video_view(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_video_view(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.increment_video_view(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_video_view(uuid) TO service_role;

-- App settings (single row) for admin-configurable exam date
CREATE TABLE IF NOT EXISTS public.app_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  jee_main_date date NOT NULL DEFAULT '2027-01-24',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT ON public.app_settings TO authenticated, anon;
GRANT UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_settings_read" ON public.app_settings FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "app_settings_admin_update" ON public.app_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.app_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Unified Pulse feed view (security_invoker => underlying RLS applies)
CREATE OR REPLACE VIEW public.pulse_feed_items
WITH (security_invoker = true) AS
SELECT
  v.id,
  'video'::text                AS item_type,
  v.title,
  NULL::text                   AS body_text,
  NULL::uuid                   AS author_id,
  NULL::text                   AS author_name,
  NULL::text                   AS author_avatar_url,
  NULL::text                   AS image_url,
  v.youtube_video_id,
  v.subject,
  v.chapter,
  0::bigint                    AS like_count,
  0::bigint                    AS comment_count,
  v.created_at
FROM public.video_lectures v
WHERE v.is_published = true
UNION ALL
SELECT
  p.id,
  'post'::text                 AS item_type,
  NULL::text                   AS title,
  p.body                       AS body_text,
  p.user_id                    AS author_id,
  pr.full_name                 AS author_name,
  pr.avatar_url                AS author_avatar_url,
  p.image_url,
  NULL::text                   AS youtube_video_id,
  NULL::text                   AS subject,
  NULL::text                   AS chapter,
  (SELECT count(*) FROM public.feed_likes l WHERE l.target_type = 'post' AND l.target_id = p.id) AS like_count,
  (SELECT count(*) FROM public.feed_comments c WHERE c.post_id = p.id) AS comment_count,
  p.created_at
FROM public.feed_posts p
LEFT JOIN public.profiles pr ON pr.id = p.user_id;

GRANT SELECT ON public.pulse_feed_items TO authenticated, anon;

-- Scheduled AI test generation plan
CREATE TABLE IF NOT EXISTS public.scheduled_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_number integer NOT NULL,
  scheduled_date date NOT NULL,
  test_name text NOT NULL,
  subjects jsonb NOT NULL,
  total_questions integer NOT NULL DEFAULT 90,
  status text NOT NULL DEFAULT 'pending',
  generated_test_id uuid REFERENCES public.tests(id) ON DELETE SET NULL,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_tests TO authenticated;
GRANT ALL ON public.scheduled_tests TO service_role;
ALTER TABLE public.scheduled_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scheduled_tests_admin_all" ON public.scheduled_tests
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER scheduled_tests_touch BEFORE UPDATE ON public.scheduled_tests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE UNIQUE INDEX IF NOT EXISTS scheduled_tests_number_idx ON public.scheduled_tests (test_number);

INSERT INTO public.scheduled_tests (test_number, scheduled_date, test_name, subjects, total_questions) VALUES
(1, '2026-08-06', 'PCMB Test 1', '{"physics":["Physical World","Units & Measurements"],"chemistry":["Some Basic Concepts of Chemistry"],"mathematics":["Sets"],"biology":["The Living World"]}', 90),
(2, '2026-08-09', 'PCMB Test 2', '{"physics":["Motion in a Straight Line"],"chemistry":["Structure of Atom"],"mathematics":["Relations & Functions"],"biology":["Biological Classification"]}', 90),
(3, '2026-08-12', 'PCMB Test 3', '{"physics":["Motion in a Plane"],"chemistry":["Classification of Elements & Periodicity"],"mathematics":["Trigonometric Functions"],"biology":["Plant Kingdom"]}', 90),
(4, '2026-08-15', 'PCMB Test 4', '{"physics":["Laws of Motion"],"chemistry":["Chemical Bonding & Molecular Structure"],"mathematics":["Complex Numbers & Quadratic Equations"],"biology":["Animal Kingdom"]}', 90),
(5, '2026-08-18', 'PCMB Test 5', '{"physics":["Work, Energy & Power"],"chemistry":["Thermodynamics"],"mathematics":["Linear Inequalities"],"biology":["Morphology of Flowering Plants"]}', 90),
(6, '2026-08-21', 'PCMB Test 6', '{"physics":["System of Particles & Rotational Motion"],"chemistry":["Equilibrium"],"mathematics":["Permutations & Combinations"],"biology":["Anatomy of Flowering Plants"]}', 90),
(7, '2026-08-24', 'PCMB Test 7', '{"physics":["Gravitation"],"chemistry":["Redox Reactions"],"mathematics":["Binomial Theorem"],"biology":["Structural Organisation in Animals"]}', 90),
(8, '2026-08-27', 'PCMB Test 8', '{"physics":["Mechanical Properties of Solids & Fluids"],"chemistry":["Organic Chemistry - Basic Principles"],"mathematics":["Sequences & Series"],"biology":["Cell - The Unit of Life"]}', 90),
(9, '2026-08-30', 'PCMB Test 9', '{"physics":["Thermal Properties of Matter","Thermodynamics"],"chemistry":["Hydrocarbons"],"mathematics":["Straight Lines"],"biology":["Biomolecules"]}', 90),
(10, '2026-09-02', 'PCMB Test 10', '{"physics":["Kinetic Theory"],"chemistry":["Environmental Chemistry"],"mathematics":["Conic Sections"],"biology":["Cell Cycle & Cell Division"]}', 90),
(11, '2026-09-05', 'PCMB Test 11', '{"physics":["Oscillations"],"mathematics":["Introduction to 3D Geometry"],"biology":["Transport in Plants"]}', 90),
(12, '2026-09-08', 'PCMB Test 12', '{"physics":["Waves"],"mathematics":["Limits & Derivatives"],"biology":["Mineral Nutrition"]}', 90),
(13, '2026-09-11', 'PCMB Test 13', '{"mathematics":["Statistics","Probability"],"biology":["Photosynthesis in Higher Plants","Respiration in Plants"]}', 90),
(14, '2026-09-14', 'PCMB Test 14', '{"biology":["Plant Growth & Development","Digestion & Absorption"]}', 90),
(15, '2026-09-17', 'PCMB Test 15', '{"biology":["Breathing & Exchange of Gases","Body Fluids & Circulation"]}', 90),
(16, '2026-09-20', 'PCMB Test 16', '{"biology":["Excretory Products & Elimination","Locomotion & Movement"]}', 90),
(17, '2026-09-23', 'PCMB Test 17', '{"biology":["Neural Control & Coordination","Chemical Coordination & Integration"]}', 90),
(18, '2026-09-26', 'PCMB Grand Test', '{"physics":["all chapters from Test 1-12"],"chemistry":["all chapters from Test 1-10"],"mathematics":["all chapters from Test 1-13"],"biology":["all chapters from Test 1-17"]}', 100)
ON CONFLICT (test_number) DO NOTHING;