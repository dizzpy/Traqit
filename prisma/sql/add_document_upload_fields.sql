-- Adds file-upload support to Document for story 5.2, via a targeted
-- statement rather than `prisma db push` (see add_application_is_non_paid.sql
-- for why: db push on this branch also tries to drop 6 unrelated CV-feature
-- tables that exist in this shared database but aren't in this schema).

ALTER TABLE "Document"
  ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'link',
  ADD COLUMN IF NOT EXISTS "storagePath" TEXT,
  ADD COLUMN IF NOT EXISTS "fileSize" INTEGER,
  ADD COLUMN IF NOT EXISTS "mimeType" TEXT;
