-- Daily server-side purge of trashed items older than 30 days.
--
-- This is the PRIMARY half of the retention policy. The app also runs a "lazy"
-- sweep (src/lib/trash.ts → purgeExpiredTrash) on every Trash read, so retention
-- still holds even if this job isn't installed — but the cron job guarantees
-- cleanup for users who never open the Trash page.
--
-- HOW TO INSTALL (once): open Supabase → SQL Editor, paste, run.
-- Requires the pg_cron extension (available on Supabase). Table/column names are
-- case-sensitive and match the Prisma models exactly.

create extension if not exists pg_cron;

-- Re-running is safe: unschedule any previous version first.
select cron.unschedule('purge-trash-daily')
where exists (select 1 from cron.job where jobname = 'purge-trash-daily');

select cron.schedule(
  'purge-trash-daily',
  '0 3 * * *', -- every day at 03:00 UTC
  $$
    delete from "Application"
      where "deletedAt" is not null and "deletedAt" < now() - interval '30 days';
    delete from "EmailTemplate"
      where "deletedAt" is not null and "deletedAt" < now() - interval '30 days';
  $$
);

-- Verify:    select * from cron.job where jobname = 'purge-trash-daily';
-- Remove:    select cron.unschedule('purge-trash-daily');
