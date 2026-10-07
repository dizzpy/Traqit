-- Story 3.5: stage time of day + user timezone, via a targeted statement
-- rather than `prisma db push` (see add_application_is_non_paid.sql for why).
-- Existing stages default to all-day (hasTime = false), so no data changes.

ALTER TABLE "PipelineStage"
  ADD COLUMN IF NOT EXISTS "hasTime" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Profile"
  ADD COLUMN IF NOT EXISTS "timezone" TEXT;
