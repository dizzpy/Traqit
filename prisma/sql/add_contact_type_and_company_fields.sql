-- Adds Person/Company contact support for story 4.2, via a targeted
-- statement rather than `prisma db push` (see add_application_is_non_paid.sql
-- for why: db push on this branch also tries to drop 6 unrelated CV-feature
-- tables that exist in this shared database but aren't in this schema).

DO $$ BEGIN
  CREATE TYPE "ContactType" AS ENUM ('PERSON', 'COMPANY');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Contact"
  ADD COLUMN IF NOT EXISTS "type" "ContactType" NOT NULL DEFAULT 'PERSON',
  ADD COLUMN IF NOT EXISTS "websiteUrl" TEXT;

-- Existing contacts have no notion of type yet and are all people — the
-- column default above already backfills them to PERSON with zero data loss.

-- Role is required for PERSON but optional for COMPANY (enforced at the API
-- layer), so the column itself must allow NULL.
ALTER TABLE "Contact" ALTER COLUMN "role" DROP NOT NULL;
