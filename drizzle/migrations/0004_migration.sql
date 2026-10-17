DROP POLICY IF EXISTS "Authenticated users can view alumni outcomes" ON public.jee_alumni_outcomes;
CREATE POLICY "Admins can view alumni outcomes" ON public.jee_alumni_outcomes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Authenticated users can view inclusion grievance channels" ON public.jee_inclusion_grievance_channels;
CREATE POLICY "Admins can view inclusion grievance channels" ON public.jee_inclusion_grievance_channels FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Authenticated users can view sustainability metrics" ON public.jee_sustainability_metrics;
CREATE POLICY "Admins can view sustainability metrics" ON public.jee_sustainability_metrics FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));