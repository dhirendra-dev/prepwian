DROP POLICY IF EXISTS "Authenticated users can view international faculty programs" ON public.jee_international_faculty_programs;
CREATE POLICY "Admins can view international faculty programs" ON public.jee_international_faculty_programs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Authenticated users can view compliance records" ON public.jee_compliance_records;
CREATE POLICY "Admins can view compliance records" ON public.jee_compliance_records FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Authenticated users can view library resources" ON public.jee_library_resources;
CREATE POLICY "Admins can view library resources" ON public.jee_library_resources FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));