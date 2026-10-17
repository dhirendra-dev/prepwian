CREATE TABLE public.material_trusted_users (
  user_id uuid PRIMARY KEY,
  granted_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.material_trusted_users TO authenticated;
GRANT ALL ON public.material_trusted_users TO service_role;

ALTER TABLE public.material_trusted_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view trusted material users"
ON public.material_trusted_users
FOR SELECT
TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "Admins can grant trusted material access"
ON public.material_trusted_users
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role((SELECT auth.uid()), 'admin')
  AND granted_by = (SELECT auth.uid())
);

CREATE POLICY "Admins can revoke trusted material access"
ON public.material_trusted_users
FOR DELETE
TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'));

CREATE INDEX material_trusted_users_created_at_idx
ON public.material_trusted_users (created_at DESC);