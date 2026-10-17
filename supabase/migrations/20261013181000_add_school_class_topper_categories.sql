-- Extend the topper directory to support school-grade achievers as well as entrance exams.
ALTER TABLE public.toppers
  DROP CONSTRAINT IF EXISTS toppers_exam_check;

ALTER TABLE public.toppers
  ADD CONSTRAINT toppers_exam_check
  CHECK (exam IN ('class_10', 'class_11', 'class_12', 'jee_main', 'jee_advanced', 'neet'));
