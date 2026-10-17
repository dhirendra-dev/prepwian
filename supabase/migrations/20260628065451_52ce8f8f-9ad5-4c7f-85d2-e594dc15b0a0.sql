
ALTER TABLE public.certificate_types DROP CONSTRAINT certificate_types_category_check;
ALTER TABLE public.certificate_types ADD CONSTRAINT certificate_types_category_check
  CHECK (category = ANY (ARRAY['membership','streak','hours','mastery','custom','pomodoro']));

INSERT INTO public.certificate_types (code, name, description, category, threshold, icon, sort_order) VALUES
  ('pomo_streak_3',   '3-Day Focus Streak',   'Completed at least one Pomodoro on 3 consecutive days.',   'pomodoro', 3,   'flame',  20),
  ('pomo_streak_7',   '7-Day Focus Streak',   'Completed at least one Pomodoro on 7 consecutive days.',   'pomodoro', 7,   'flame',  21),
  ('pomo_streak_14',  '14-Day Focus Streak',  'Completed at least one Pomodoro on 14 consecutive days.',  'pomodoro', 14,  'flame',  22),
  ('pomo_streak_30',  '30-Day Focus Streak',  'Completed at least one Pomodoro on 30 consecutive days.',  'pomodoro', 30,  'flame',  23),
  ('pomo_count_10',   '10 Pomodoros',         'Completed 10 Pomodoro sessions.',                          'pomodoro', 10,  'target', 24),
  ('pomo_count_50',   '50 Pomodoros',         'Completed 50 Pomodoro sessions.',                          'pomodoro', 50,  'target', 25),
  ('pomo_count_100',  '100 Pomodoros',        'Completed 100 Pomodoro sessions — focused warrior.',       'pomodoro', 100, 'target', 26),
  ('pomo_count_500',  '500 Pomodoros',        'Completed 500 Pomodoro sessions — deep work master.',      'pomodoro', 500, 'target', 27)
ON CONFLICT (code) DO NOTHING;
