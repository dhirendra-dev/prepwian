CREATE TABLE public.feedback_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('feedback','material_request')),
  category text NOT NULL DEFAULT 'general',
  rating int CHECK (rating BETWEEN 1 AND 5),
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 2 AND 150),
  message text NOT NULL CHECK (char_length(message) BETWEEN 5 AND 3000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','rejected')),
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_submissions TO authenticated;
GRANT ALL ON public.feedback_submissions TO service_role;
ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY fs_select ON public.feedback_submissions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY fs_insert ON public.feedback_submissions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending' AND admin_note IS NULL);
CREATE POLICY fs_admin_update ON public.feedback_submissions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY fs_admin_delete ON public.feedback_submissions FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX feedback_submissions_user_idx ON public.feedback_submissions(user_id, created_at DESC);
CREATE INDEX feedback_submissions_kind_idx ON public.feedback_submissions(kind, status, created_at DESC);
CREATE TRIGGER feedback_submissions_touch BEFORE UPDATE ON public.feedback_submissions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.feedback_wall_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL CHECK (char_length(message) BETWEEN 2 AND 500),
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feedback_wall_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_wall_posts TO authenticated;
GRANT ALL ON public.feedback_wall_posts TO service_role;
ALTER TABLE public.feedback_wall_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY fw_select ON public.feedback_wall_posts FOR SELECT TO anon, authenticated USING (hidden = false OR user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY fw_insert ON public.feedback_wall_posts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND hidden = false AND public.can_user_post(auth.uid()));
CREATE POLICY fw_admin_update ON public.feedback_wall_posts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY fw_delete ON public.feedback_wall_posts FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE INDEX feedback_wall_posts_created_idx ON public.feedback_wall_posts(created_at DESC);
CREATE TRIGGER feedback_wall_posts_touch BEFORE UPDATE ON public.feedback_wall_posts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.feedback_wall_likes (
  post_id uuid NOT NULL REFERENCES public.feedback_wall_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
GRANT SELECT ON public.feedback_wall_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.feedback_wall_likes TO authenticated;
GRANT ALL ON public.feedback_wall_likes TO service_role;
ALTER TABLE public.feedback_wall_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY fwl_select ON public.feedback_wall_likes FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.feedback_wall_posts p WHERE p.id = post_id));
CREATE POLICY fwl_insert ON public.feedback_wall_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.feedback_wall_posts p WHERE p.id = post_id AND p.hidden = false));
CREATE POLICY fwl_delete ON public.feedback_wall_likes FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX feedback_wall_likes_user_idx ON public.feedback_wall_likes(user_id);

CREATE TABLE public.feedback_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 150),
  url text NOT NULL CHECK (url ~ '^https://'),
  description text,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feedback_forms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_forms TO authenticated;
GRANT ALL ON public.feedback_forms TO service_role;
ALTER TABLE public.feedback_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY ff_select ON public.feedback_forms FOR SELECT TO anon, authenticated USING (active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY ff_admin_all ON public.feedback_forms FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER feedback_forms_touch BEFORE UPDATE ON public.feedback_forms FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.feedback_forms (title, url, description) VALUES
('Class 10th Toppers — Official Form', 'https://forms.gle/QvZeQ8wbPZHvMXa7A', 'Official topper submission form (ID 1FAIpQLSeOgphj4n1SSDZByEJAyoDYfyuJUAGBiwQHKt4aoXemFMRcfQ).');