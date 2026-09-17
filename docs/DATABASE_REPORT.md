# InternTracker (traqit) — Database Report

**Date:** 2026-06-14
**Engine:** PostgreSQL (Supabase, region `ap-northeast-1`)
**ORM:** Prisma 7.8 via `@prisma/adapter-pg` (driver adapter)
**Verification:** Live, read-only catalog inspection of the production database (`pg_class`, `pg_policies`, `pg_extension`, `cron.job`, `pg_index`) on 2026-06-14.

---

## TL;DR

- ✅ **11 tables, all with RLS enabled and zero policies — verified live.** This is the correct **deny-all** posture: the public anon/PostgREST roles can touch nothing; the app reaches data only through Prisma's owner role.
- ✅ **The new `Subscription` table is already live** — RLS on, **2 rows** (one per existing profile, i.e. the backfill ran). The `Plan` enum (`FREE, PRO, MAX`) exists. The migration steps flagged "pending" in the earlier audit have since been applied. ✔
- ✅ **Retention automation is running**: `pg_cron` job `purge-trash-daily` (`0 3 * * *`) is **active**.
- ✅ Required extensions present: `pgcrypto` (for `gen_random_uuid()` in the backfill), `pg_cron`, `pg_stat_statements`.
- ✅ Indexing matches the schema exactly; every foreign key is `ON DELETE CASCADE`.
- 🟡 Minor config/hardening notes below (pooler vs. direct connection for migrations; no DB-level check constraints).

---

## 1. Live verification snapshot (2026-06-14)

| Table | RLS enabled | Policies | Rows | Indexes |
|---|:--:|:--:|--:|--:|
| Profile | ✅ | 0 | 2 | 3 |
| Subscription | ✅ | 0 | 2 | 2 |
| Application | ✅ | 0 | 9 | 6 |
| PipelineStage | ✅ | 0 | 10 | 3 |
| Contact | ✅ | 0 | 1 | 2 |
| Document | ✅ | 0 | 0 | 2 |
| Activity | ✅ | 0 | 13 | 3 |
| Source | ✅ | 0 | 9 | 2 |
| JobType | ✅ | 0 | 6 | 2 |
| PipelineTemplate | ✅ | 0 | 4 | 2 |
| EmailTemplate | ✅ | 0 | 6 | 3 |

**Enums:** `ApplicationStatus` (8 values), `StageStatus` (5), `Plan` (FREE, PRO, MAX).
**Extensions:** `pg_cron 1.6.4`, `pgcrypto 1.3`, `pg_stat_statements 1.11`, `uuid-ossp 1.1`, `supabase_vault 0.3.1`, `plpgsql`.
**Cron:** `purge-trash-daily` — `0 3 * * *` — active.

Row counts confirm this is effectively a fresh/dev dataset (2 accounts + seeded sample applications).

---

## 2. Tables & purpose

All IDs are `cuid()` strings. All `profileId`/`applicationId` foreign keys are **`ON DELETE CASCADE`**.

### Identity & billing
- **Profile** — one per Supabase auth user. Holds `userId` (auth UUID, unique), `email` (unique), display `name`, and preferences (`defaultCurrency`, `defaultPipelineTemplateId`, `ghostThresholdDays`, `emailName`, `remindersEnabled`, `reminderLeadTime`, `onboardedAt`). Root of all owned data.
- **Subscription** — **1:1 with Profile** (`profileId` unique). Carries `plan` (`Plan` enum, default `FREE`) + timestamps. Deliberately a separate table so it can grow into a full billing record (provider id, period dates, status). Auto-created `FREE` on signup; existing rows backfilled.

### Core tracking
- **Application** — the central entity. Company/role/links, `jobType`/`workMode`/`appliedVia`, salary range + currency, `status` (`ApplicationStatus`), date fields, free-text `notes`, and **`deletedAt`** for soft-delete (Trash). Heavily indexed by `profileId` (see §5).
- **PipelineStage** — ordered interview stages per application (`name`, `order`, `status`=`StageStatus`, scheduled/completed dates). *Intentionally no `@@unique([applicationId, order])`* — reordering via incremental UPDATEs would trip a per-row unique check mid-statement; order is treated as a sort key only.
- **Contact** — people tied to an application (name/role/email/phone/LinkedIn, optional `stageName`).
- **Document** — named links (`url`, `type`) per application.
- **Activity** — append-only audit log per application (`type`, `description`, optional `metadata` JSON). E.g. status-change events.

### User presets & templates
- **Source** / **JobType** — per-profile custom dropdown values with `usageCount`; unique on `(profileId, name)`.
- **PipelineTemplate** — reusable stage sets stored as JSON `stages`; `isDefault` flag; unique on `(profileId, name)`.
- **EmailTemplate** — outreach templates (`subject`, `body`, `category`, `order`), soft-deletable (`deletedAt`); unique on `(profileId, name)`.

---

## 3. Relationships (cascade map)

```
Profile (1)
 ├─1:1─ Subscription
 ├─1:N─ Application ──┬─1:N─ PipelineStage
 │                    ├─1:N─ Contact
 │                    ├─1:N─ Document
 │                    └─1:N─ Activity
 ├─1:N─ Source
 ├─1:N─ JobType
 ├─1:N─ PipelineTemplate
 └─1:N─ EmailTemplate
```

Deleting a **Profile** cascades to everything it owns (used by `DELETE /api/profile` for full-account deletion). Deleting an **Application** cascades to its stages/contacts/documents/activity. This is enforced at the DB level via FK `ON DELETE CASCADE`, not just in app code.

---

## 4. Row-Level Security (the security model)

**Design:** RLS is **enabled on every table with no policies** (`prisma/rls.sql`) — a deny-all wall. Verified live: all 11 tables `relrowsecurity = true`, `pg_policies` returns **0 rows** for `public`.

**Why it matters:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` ships to the browser and unlocks Supabase's auto-generated Data API (PostgREST). Without RLS, anyone with that public key could read/write every row directly, bypassing the app. Deny-all RLS shuts that door completely.

**How the app still works:** Prisma connects with the database **owner role**, which bypasses RLS. Data access is therefore gated entirely by application logic — and that logic consistently scopes every query to the authenticated `profileId` (confirmed in the code audit). The anon key is used **only** for auth (`getUser()` JWT validation), never for data.

**Operational note:** RLS must be re-applied (`prisma/rls.sql` is idempotent) after any `db push` that introduces a new table. This was correctly done for `Subscription` (verified RLS-on). Keep this in the deploy runbook.

---

## 5. Indexing strategy

Index counts verified live; all match the schema.

- **Application** (6 indexes): PK + five composite `@@index` rooted at `profileId`: `[profileId]`, `[profileId, status]`, `[profileId, appliedDate]`, `[profileId, createdAt]`, `[profileId, deletedAt]`. These back the filtered/sorted/paginated list queries (`GET /api/applications`) and the `deletedAt: null` Trash filter — well-targeted for the actual access patterns.
- **PipelineStage** (3): PK + `[applicationId]` + `[applicationId, order]` (the sort key).
- **Activity** (3): PK + `[applicationId]` + `[applicationId, createdAt]` (timeline ordering).
- **Contact / Document** (2 each): PK + `[applicationId]`.
- **EmailTemplate** (3): PK + unique `[profileId, name]` + `[profileId, deletedAt]`.
- **Source / JobType / PipelineTemplate** (2 each): PK + unique `[profileId, name]`.
- **Profile** (3): PK + unique `userId` + unique `email`.
- **Subscription** (2): PK + unique `profileId` (the 1:1 + its only lookup path).

**Assessment:** indexing is appropriate and not excessive. At current/expected scale (a personal job tracker) there are no missing-index concerns.

---

## 6. Data integrity & retention

- **Foreign keys:** every relation has an explicit FK with `ON DELETE CASCADE` — no orphan rows possible.
- **Uniqueness:** `Profile.userId`, `Profile.email`, `Subscription.profileId`, and `(profileId, name)` on all four preset/template tables.
- **Enums** enforce valid `status` / `plan` / stage states at the DB level.
- **Soft delete + retention:** `Application.deletedAt` / `EmailTemplate.deletedAt` mark Trash. Two-layer cleanup: the active `pg_cron` job `purge-trash-daily` (primary) plus a lazy app-side sweep on every Trash read (`src/lib/trash.ts`) — retention holds even if the cron job were ever removed.
- **Gap (minor):** no DB-level CHECK constraints for semantic rules (e.g. `salaryMin <= salaryMax`). These are validated in Zod at the API layer, so it's belt-without-suspenders, not a correctness hole.

---

## 7. Connection architecture

- **Client:** lazy singleton `PrismaClient` over `PrismaPg` adapter (`src/lib/prisma.ts`), instantiated on first access via a `Proxy` — avoids creating connections at module load (important for serverless cold starts).
- **Connection string:** the live connection resolved to `aws-1-ap-northeast-1.pooler.supabase.com:5432` (Supabase **pooler**). The app reads `DATABASE_URL`; Prisma CLI/config (`prisma.config.ts`) prefers `DIRECT_URL`.
- **Cache in front of the DB:** Upstash Redis (`src/lib/redis.ts`) caches profile, applications-list, presets, templates and analytics reads with per-key TTLs and scoped invalidation on write — reduces DB round-trips. Fails open (DB is always source of truth).

**Recommendations:**
- 🟡 For migrations, `DIRECT_URL` should point at the **direct, non-pooled** connection (`db.<ref>.supabase.co:5432`) and `DATABASE_URL` at the **transaction pooler** (`...pooler...:6543` with `?pgbouncer=true`). Running `prisma db push`/`migrate` through a pooler can intermittently fail on advisory locks / prepared statements. It worked here, but the split is the safer setup for serverless + migrations.
- 🟢 Confirm Supabase **Point-in-Time Recovery / automated backups** are enabled for the project (managed by Supabase; can't be seen from SQL). For anything beyond a hobby launch, enable PITR.

---

## 8. Schema-management workflow

- **No migration history is used** — the project is driven by `prisma db push` (schema-as-source-of-truth); `prisma/migrations/` is configured in `prisma.config.ts` but not populated. Fine for a solo project, but it means **schema changes aren't versioned/auditable** and there's no down-migration path.
- **Recommendation (optional):** once the schema stabilizes for production, switch to `prisma migrate` so every change is a reviewable, replayable migration file. Until then, keep `rls.sql` + the `prisma/sql/*` scripts as the manual post-`db push` checklist.

---

## 9. DB-specific action items

**Already done (verified live):** ✅ Subscription table + RLS + backfill applied · ✅ deny-all RLS on all tables · ✅ pg_cron purge active · ✅ pgcrypto present.

**Recommended:**
- [ ] Verify `DIRECT_URL` = direct connection, `DATABASE_URL` = transaction pooler (`:6543?pgbouncer=true`) — see §7.
- [ ] Confirm Supabase PITR/backups enabled.
- [ ] (Optional) Adopt `prisma migrate` for versioned schema history before heavy production use.
- [ ] (Optional) Add CHECK constraints for semantic invariants (salary range, non-negative `usageCount`).
- [ ] Keep "re-run `rls.sql` after every `db push` that adds a table" in the deploy runbook.

---

## 10. Overall

The database is in good shape and **its security posture is verified in production, not just on paper**: deny-all RLS everywhere, cascade-clean relations, sensible indexing, active retention automation, and the new Subscription tier already migrated and backfilled. The only items are operational polish (pooler/direct split, backups, optional migration history) — none are blockers.
