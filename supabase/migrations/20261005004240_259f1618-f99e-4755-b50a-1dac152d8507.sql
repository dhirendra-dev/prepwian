DROP POLICY IF EXISTS "Authenticated users can view research outputs" ON public.jee_research_outputs;
CREATE POLICY "Admins can view research outputs" ON public.jee_research_outputs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Authenticated users can view local cost benchmarks" ON public.jee_local_cost_benchmarks;
CREATE POLICY "Admins can view local cost benchmarks" ON public.jee_local_cost_benchmarks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Authenticated users can view review source profiles" ON public.jee_review_source_profiles;
CREATE POLICY "Admins can view review source profiles" ON public.jee_review_source_profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));