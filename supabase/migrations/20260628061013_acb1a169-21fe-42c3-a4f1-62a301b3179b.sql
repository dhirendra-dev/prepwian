CREATE POLICY "Public can view materials" ON public.materials FOR SELECT TO anon USING (true);
GRANT SELECT ON public.materials TO anon;