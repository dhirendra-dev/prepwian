DROP POLICY IF EXISTS "Authenticated users can view security infrastructure" ON public.jee_security_infrastructure;
CREATE POLICY "Admins can view security infrastructure" ON public.jee_security_infrastructure FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Authenticated users can read hostel profiles" ON public.jee_hostel_profiles;
CREATE POLICY "Admins can read hostel profiles" ON public.jee_hostel_profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Authenticated users can view student transfers" ON public.jee_student_transfers;
CREATE POLICY "Admins can view student transfers" ON public.jee_student_transfers FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));