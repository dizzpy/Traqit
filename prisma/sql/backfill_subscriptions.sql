-- ─── Backfill subscriptions ─────────────────────────────────────────────────
-- One-time, idempotent: gives every existing Profile a FREE Subscription row.
-- New accounts get one automatically at signup (see getOrCreateProfileForUser);
-- this covers profiles created before the Subscription table existed.
--
-- Run on the Supabase SQL editor (or `psql $DIRECT_URL -f prisma/sql/backfill_subscriptions.sql`).
-- Re-run safe: the NOT EXISTS guard skips profiles that already have a row.

INSERT INTO "Subscription" (id, "profileId", plan, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, p.id, 'FREE', now(), now()
FROM "Profile" p
LEFT JOIN "Subscription" s ON s."profileId" = p.id
WHERE s.id IS NULL;
