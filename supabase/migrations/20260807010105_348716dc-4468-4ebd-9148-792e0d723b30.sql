CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'publish_due_test_results') THEN
    PERFORM cron.unschedule('publish_due_test_results');
  END IF;
END $$;

SELECT cron.schedule(
  'publish_due_test_results',
  '* * * * *',
  $$SELECT public.publish_due_test_results();$$
);