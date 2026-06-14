-- ─── Row Level Security (deny-all) ──────────────────────────────────────────
-- Why: the public anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY) ships to the browser
-- and unlocks Supabase's auto Data API (PostgREST). With RLS off, anyone with
-- that key could read/write every row directly, bypassing the app.
--
-- This enables RLS on every table with NO policies, so the anon/authenticated
-- PostgREST roles are denied everything. The app is UNAFFECTED: Prisma connects
-- as the `postgres` owner role, which bypasses RLS.
--
-- Run on the Supabase SQL editor (or `psql $DIRECT_URL -f prisma/rls.sql`).
-- Re-run safe: ENABLE ROW LEVEL SECURITY is idempotent.

ALTER TABLE public."Profile"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Subscription"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Application"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PipelineStage"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Contact"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Document"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Activity"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Source"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."JobType"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PipelineTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."EmailTemplate"    ENABLE ROW LEVEL SECURITY;
