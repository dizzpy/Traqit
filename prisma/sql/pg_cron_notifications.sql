-- Every-15-minute email notification checks: ghost alerts (story 8.2) and
-- stage reminders (story 12.5). pg_cron fires, pg_net POSTs to the app's
-- /api/cron/* routes, and the app does the querying + sending. 15 minutes is
-- tight enough to honor the shortest reminder lead time (1 hour).
--
-- HOW TO INSTALL (once per environment): open Supabase → SQL Editor, replace
-- the two placeholder values below, run. The app needs the same CRON_SECRET
-- in its env, plus SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / EMAIL_FROM.
--
-- The URL and secret live in Supabase Vault, not in the job's command text,
-- so the secret never shows up in cron.job. Re-running updates them.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 1. Store the app URL + shared secret (replace the placeholders).
do $$
declare
  app_url text := 'https://YOUR-APP-DOMAIN';   -- no trailing slash
  secret  text := 'YOUR-CRON-SECRET';          -- same value as CRON_SECRET
begin
  if exists (select 1 from vault.secrets where name = 'traqit_app_url') then
    perform vault.update_secret(
      (select id from vault.secrets where name = 'traqit_app_url'), app_url);
  else
    perform vault.create_secret(app_url, 'traqit_app_url');
  end if;
  if exists (select 1 from vault.secrets where name = 'traqit_cron_secret') then
    perform vault.update_secret(
      (select id from vault.secrets where name = 'traqit_cron_secret'), secret);
  else
    perform vault.create_secret(secret, 'traqit_cron_secret');
  end if;
end $$;

-- 2. Schedule the job. Re-running is safe: unschedule any previous version.
select cron.unschedule('email-notifications')
where exists (select 1 from cron.job where jobname = 'email-notifications');

select cron.schedule(
  'email-notifications',
  '*/15 * * * *',
  $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'traqit_app_url') || path,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'traqit_cron_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    )
    from unnest(array['/api/cron/reminder-check', '/api/cron/ghost-check']) as path;
  $$
);

-- Verify:    select * from cron.job where jobname = 'email-notifications';
-- Runs:      select * from cron.job_run_details order by start_time desc limit 10;
-- Responses: select status_code, content from net._http_response order by created desc limit 10;
-- Remove:    select cron.unschedule('email-notifications');
