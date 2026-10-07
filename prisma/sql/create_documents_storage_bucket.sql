-- Creates the private Storage bucket for uploaded documents (story 5.2).
--
-- Deliberately PRIVATE (public = false) and has NO storage.objects RLS
-- policies granting anon/authenticated access. Every upload, download and
-- delete goes through server routes using the service-role client
-- (src/lib/supabase/admin.ts), which already enforces per-profile ownership
-- the same way every other route in this app does (getProfile() + an
-- applicationId ownership check) — matching this project's existing
-- deny-all-RLS-at-the-DB-layer, authorize-in-the-API-layer convention
-- (see DATABASE_REPORT.md). The browser never talks to Supabase Storage
-- directly, so no bucket-level RLS policy is needed for isolation; a private
-- bucket with only the service-role key able to read/write is already the
-- correct posture.
--
-- HOW TO INSTALL (once): open Supabase → SQL Editor, paste, run.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760, -- 10 MB
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Verify:  select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'documents';
