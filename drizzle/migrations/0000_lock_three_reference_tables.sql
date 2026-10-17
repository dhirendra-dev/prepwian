DROP POLICY IF EXISTS "Authenticated users can view governance structure history" ON public.jee_governance_structure_history;
CREATE POLICY "Admins can view governance structure history" ON public.jee_governance_structure_history FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Authenticated users can view laboratory inventory" ON public.jee_laboratory_inventory;
CREATE POLICY "Admins can view laboratory inventory" ON public.jee_laboratory_inventory FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Authenticated users can view internet connectivity" ON public.jee_internet_connectivity;
CREATE POLICY "Admins can view internet connectivity" ON public.jee_internet_connectivity FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));