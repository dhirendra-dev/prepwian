DROP POLICY IF EXISTS "Authenticated users can view learning platforms" ON public.jee_learning_platforms;
CREATE POLICY "Admins can view learning platforms" ON public.jee_learning_platforms FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Authenticated users can view student experience themes" ON public.jee_student_experience_themes;
CREATE POLICY "Admins can view student experience themes" ON public.jee_student_experience_themes FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Authenticated users can view compliance certificates" ON public.jee_compliance_certificates;
CREATE POLICY "Admins can view compliance certificates" ON public.jee_compliance_certificates FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));