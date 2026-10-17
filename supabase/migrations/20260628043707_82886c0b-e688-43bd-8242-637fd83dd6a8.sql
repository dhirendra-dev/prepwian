CREATE TYPE public.community_group_category AS ENUM ('main', 'batch', 'notes', 'discussion', 'doubt', 'problem_solving', 'resources');

CREATE TYPE public.community_platform AS ENUM ('whatsapp', 'telegram', 'discord', 'other');

CREATE TABLE public.community_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category public.community_group_category NOT NULL DEFAULT 'discussion',
  platform public.community_platform NOT NULL DEFAULT 'whatsapp',
  invite_url text NOT NULL,
  icon_emoji text NOT NULL DEFAULT '💬',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.community_groups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_groups TO authenticated;
GRANT ALL ON public.community_groups TO service_role;

ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active community groups"
  ON public.community_groups FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can insert community groups"
  ON public.community_groups FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update community groups"
  ON public.community_groups FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete community groups"
  ON public.community_groups FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX community_groups_sort_idx ON public.community_groups(sort_order, is_active);

CREATE TRIGGER community_groups_touch
  BEFORE UPDATE ON public.community_groups
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();