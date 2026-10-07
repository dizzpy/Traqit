-- Dedupe markers for the ghost-check (8.2) and reminder-check (12.5) cron
-- emails, via a targeted statement rather than `prisma db push` (see
-- add_application_is_non_paid.sql for why: db push on this branch also tries
-- to drop 6 unrelated CV-feature tables that exist in this shared database).

ALTER TABLE "Application"
  ADD COLUMN IF NOT EXISTS "ghostNotifiedAt" TIMESTAMP(3);

ALTER TABLE "PipelineStage"
  ADD COLUMN IF NOT EXISTS "reminderSentAt" TIMESTAMP(3);
