DROP POLICY IF EXISTS "Authenticated users can view governance officers" ON public.jee_governance_officers;
CREATE POLICY "Admins can view governance officers" ON public.jee_governance_officers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Authenticated users can view city profiles" ON public.jee_city_profile;
CREATE POLICY "Admins can view city profiles" ON public.jee_city_profile FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Authenticated users can view student experience trends" ON public.jee_student_experience_trends;
CREATE POLICY "Admins can view student experience trends" ON public.jee_student_experience_trends FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));