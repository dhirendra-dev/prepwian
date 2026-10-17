
-- Storage policies for avatars bucket
CREATE POLICY "Avatars are readable by anyone authenticated"
ON storage.objects FOR SELECT TO authenticated, anon
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Make profiles publicly readable so profile pages and avatars work for everyone (incl. guests)
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are publicly viewable"
ON public.profiles FOR SELECT TO anon, authenticated
USING (true);
GRANT SELECT ON public.profiles TO anon;
