-- Adds the isNonPaid column for story 2.6 without running a full `prisma db
-- push`, which on this branch would also try to drop unrelated tables
-- (AiPointLedger, CvBucket, CvProject, CvSkill, CvTemplate, GeneratedCv) that
-- belong to a separate feature sharing this database but aren't in this
-- branch's schema.prisma. This statement touches only the Application table.
ALTER TABLE "Application"
  ADD COLUMN IF NOT EXISTS "isNonPaid" BOOLEAN NOT NULL DEFAULT false;
