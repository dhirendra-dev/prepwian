ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';

CREATE TABLE IF NOT EXISTS public.moderator_permissions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  permissions text[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.moderator_permissions TO authenticated;
GRANT ALL ON public.moderator_permissions TO service_role;

ALTER TABLE public.moderator_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage moderator permissions" ON public.moderator_permissions;
CREATE POLICY "Admins manage moderator permissions"
ON public.moderator_permissions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Moderators read own permissions" ON public.moderator_permissions;
CREATE POLICY "Moderators read own permissions"
ON public.moderator_permissions FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS trg_moderator_permissions_touch ON public.moderator_permissions;
CREATE TRIGGER trg_moderator_permissions_touch
BEFORE UPDATE ON public.moderator_permissions
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::public.app_role)
      OR EXISTS (
        SELECT 1 FROM public.moderator_permissions mp
        WHERE mp.user_id = _user_id AND _permission = ANY(mp.permissions)
      );
$$;

REVOKE ALL ON FUNCTION public.has_permission(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated, service_role;

ALTER VIEW public.pulse_feed_items SET (security_invoker = on);