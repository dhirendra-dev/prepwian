ALTER TABLE public.certificate_types DROP CONSTRAINT IF EXISTS certificate_types_category_check;
ALTER TABLE public.certificate_types ADD CONSTRAINT certificate_types_category_check
  CHECK (category IN ('membership','streak','hours','mastery','custom','pomodoro','social'));

INSERT INTO public.certificate_types (code, name, description, category, threshold, icon, sort_order)
VALUES ('whatsapp_channel_follower', 'WhatsApp Channel Follower', 'Awarded for following the official JEE Prep Hub WhatsApp channel and staying connected with announcements.', 'social', NULL, 'Award', 95)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;