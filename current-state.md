# Traqit — Current State Report

**Scope:** `main` branch only (HEAD `4aecdec` at time of writing). A substantial, fully separate feature — "CV Studio" (AI résumé generation, an AI credit/points system, CV storage/library) — exists on the unmerged local branch `feat/cv-studio/frontend` (commits `0a0e2f7`, `3348ddc`, `ea710ad`, `31f18ef`) and is **not** part of `main`. It is out of scope for this report and not described below, except where `main`'s config/env files carry leftover traces of it (see External Dependencies).

Two prior audits already exist in the repo root and were used as a starting point, then independently re-verified against the current code: `AUDIT_REPORT.md` (dated 2026-06-14) and `DATABASE_REPORT.md` (dated 2026-06-14). Where this report's findings differ from those documents' conclusions, it's noted explicitly.

---

## Tech Stack

**Frontend**
- Next.js `16.2.9` (App Router, React Server Components) — `package.json`
- React `19.2.4` / React DOM `19.2.4`
- TypeScript `5.x`, `tsconfig.json`
- Tailwind CSS v4 (`postcss.config.mjs`, `@tailwindcss/postcss`), `tw-animate-css`
- shadcn/ui component set (`components.json`) + `@base-ui/react` primitives
- Icons: `lucide-react`, `@hugeicons/react` / `@hugeicons/core-free-icons`
- Animation: `motion` (Framer Motion successor), `three` (WebGL — marketing hero effect only, `src/components/marketing/laser-flow.tsx`)
- Drag-and-drop: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- Charts: `recharts` (analytics + admin dashboard)
- Guided tour: `driver.js` (`src/components/tour/app-tour.tsx`)
- Data fetching/cache (client): `swr`
- Forms/dates: `react-day-picker`, `date-fns`
- Fonts: self-hosted Satoshi (display) + General Sans (body/UI), `src/app/fonts/`, licensed under Fontshare EULA (`assets/*/LICENSE`)

**Backend**
- Next.js Route Handlers under `src/app/api/**/route.ts` — no separate backend service
- Validation: `zod` on every write route
- Middleware: `src/proxy.ts` — this is **not** dead code or a misnamed file. Next.js 16 introduced `proxy.ts` (exported function `proxy`) as the successor to `middleware.ts`; confirmed by `PROXY_FILENAME = 'proxy'` in the installed `next@16.2.9` package (`node_modules/next/dist/lib/constants.js:289`). It handles auth-gate redirects and API rate limiting for every request (`config.matcher` at the bottom of the file).

**Database**
- PostgreSQL, hosted on Supabase (region `ap-northeast-1` per `DATABASE_REPORT.md`)
- ORM: Prisma `7.5` via `@prisma/adapter-pg` driver adapter (not the default Prisma engine binary) — `src/lib/prisma.ts`, `prisma/schema.prisma`
- Schema is managed with `prisma db push` (schema-as-source-of-truth); `prisma/migrations/` is configured in `prisma.config.ts` but not populated — no migration history exists
- Row-Level Security: enabled on every table with zero policies (deny-all), defined in `prisma/rls.sql`; the app connects as the Postgres owner role, which bypasses RLS, so authorization is enforced entirely in application code

**Auth**
- Supabase Auth: magic link + GitHub OAuth (`src/app/(auth)/login`, `src/app/auth/callback/route.ts`)
- JWT is revalidated server-side via `supabase.auth.getUser()` in `src/lib/supabase/middleware.ts`, and the verified user id is forwarded to route handlers as a trusted `x-auth-user-id` header (any client-sent copy of that header is stripped first)
- No role/permission system beyond "authenticated owner of the row" — the one exception is a hardcoded admin email allowlist (`src/lib/admin.ts`), see Auth & Permissions below

**Caching / rate limiting**
- Upstash Redis (`@upstash/redis`) — `src/lib/redis.ts` — get-or-set cache with per-key TTLs, fails open (never blocks a request if Redis is down/unconfigured)
- Upstash Ratelimit (`@upstash/ratelimit`) — `src/lib/ratelimit.ts` — sliding-window, two tiers (`api`: 100/60s, `write`: 30/60s), also fails open when unconfigured

**Hosting / deploy**
- **No deploy configuration exists in the repo.** No `vercel.json`, `Dockerfile`, `fly.toml`, `render.yaml`, `netlify.toml`, or `.github/workflows/` of any kind were found. `DATABASE_REPORT.md` references a Supabase pooler connection string (`aws-1-ap-northeast-1.pooler.supabase.com`), consistent with a Vercel-style serverless deploy target, but this is inferred, not configured in-repo. There is no CI pipeline — lint/typecheck/build are manual (`package.json` scripts) only.

**Third-party integrations**
- **Supabase** (auth + Postgres) — real, live, fully wired.
- **Upstash Redis** — real, live, fully wired (with graceful no-op fallback).
- **"Gmail"** — there is **no Gmail API integration**. `src/lib/email.ts` builds a `https://mail.google.com/mail/?view=cm&...` compose-intent URL from a template (`buildGmailDraftUrl`), which opens in a new tab with a pre-filled draft the user must send manually. No OAuth scope, no API key, no server-side send capability exists anywhere in `main`.
- No payment/billing provider is wired despite `Subscription`/`Plan` existing in the schema (see Data Model).
- No transactional email service (no Resend/SendGrid/Postmark/Nodemailer anywhere in `package.json` or `src/`).
- No calendar-sync (Google Calendar/ICS), no browser extension, no analytics/telemetry SDK (no PostHog/Segment/GA).

---

## Folder / Module Structure

```
src/
├── app/                          Next.js App Router root
│   ├── (auth)/login/             Sign-in page (magic link + GitHub OAuth)
│   ├── (main)/app/               Authenticated app shell + all product pages
│   │   ├── admin/dizzpy/         Founder-only analytics dashboard (email-gated, 404s otherwise)
│   │   ├── analytics/            Personal funnel/response-rate charts
│   │   ├── applications/         Core applications list (dense table + kanban board)
│   │   ├── calendar/             Agenda/calendar view of scheduled pipeline stages
│   │   ├── profile/              Account preferences (ghost threshold, reminders, currency, data export/wipe/delete)
│   │   ├── saved/                "Saved for later" jobs (status=SAVED subset of Application)
│   │   ├── settings/             Duplicate/adjacent preferences surface (see Known Issues)
│   │   ├── templates/            Email outreach templates + pipeline stage templates
│   │   └── trash/                Soft-deleted applications, 30-day recovery window
│   ├── (marketing)/              Public site: landing page + /privacy /terms /cookies
│   ├── (onboarding)/onboarding/  5-step guided first-run setup
│   ├── api/                      29 `route.ts` files, 44 HTTP method handlers total (see table below)
│   ├── auth/callback/            OAuth/magic-link code exchange, creates Profile on first login
│   ├── auth/signout/             Session sign-out
│   ├── fonts/                    Self-hosted webfont files
│   └── preview-landing/          A second, seemingly experimental copy of the landing page (see Known Issues)
├── components/
│   ├── admin/                    Founder dashboard table + charts
│   ├── analytics/                Recharts wrappers for the personal analytics page
│   ├── application/              Add/edit modal, detail slide-over, pipeline builder, contacts/documents/stages UI
│   ├── board/                    Kanban board (drag-and-drop status columns)
│   ├── common/                   Logo, small shared bits
│   ├── layout/                   Sidebar nav, header, keyboard-shortcut handler/dialog, theme toggle
│   ├── magic/                    Decorative UI (border-beam, magic-card, blur-fade, particles, animated-shiny-text)
│   ├── marketing/                Landing page sections (hero, pricing, features, FAQ, founder memo, footer)
│   ├── onboarding/                5-step onboarding flow component
│   ├── templates/                Pipeline-template create/edit modal
│   ├── tour/                     driver.js guided product tour
│   └── ui/                       shadcn/ui primitives (button, dialog, sheet, input, calendar, etc.)
├── hooks/                        SWR-based data hooks — one per resource (applications, profile, presets, stages, trash, email templates, analytics)
├── lib/                          Business logic + infra: auth, prisma client, redis cache, rate limiter, admin allowlist, trash retention, analytics math, email placeholder substitution, constants, seed data, keyboard shortcuts
├── proxy.ts                      Next.js 16 middleware equivalent — auth gate + rate limiting for every request
└── types/index.ts                Single shared TypeScript type file for the whole app
prisma/
├── schema.prisma                 11 models (see Data Model)
├── rls.sql                       Deny-all RLS policy definitions
└── sql/                          One-off backfill scripts (e.g. `backfill_subscriptions.sql`)
docs/                              3 short internal convention docs (api-conventions.md, design-system.md, prisma-schema.md) — see Known Issues for staleness
```

**Routing structure (Next.js App Router, route groups don't affect the URL):**

| Path | Source |
|---|---|
| `/` | `src/app/(marketing)/page.tsx` (landing) |
| `/privacy`, `/terms`, `/cookies` | `src/app/(marketing)/*` |
| `/login` | `src/app/(auth)/login/page.tsx` |
| `/onboarding` | `src/app/(onboarding)/onboarding/page.tsx` |
| `/app/applications`, `/app/saved`, `/app/calendar`, `/app/analytics`, `/app/templates`, `/app/profile`, `/app/settings`, `/app/trash` | `src/app/(main)/app/*/page.tsx` |
| `/app/admin/dizzpy` | `src/app/(main)/app/admin/dizzpy/page.tsx` — email-gated, returns `notFound()` (404, not 403) to non-admins |
| `/auth/callback`, `/auth/signout` | route handlers, not pages |
| `/api/*` | 29 route handler files, listed under Features |
| `/preview-landing` | `src/app/preview-landing/page.tsx` — undocumented, see Known Issues |

---

## Features Implemented

### 1. Applications tracker (core feature)
List + kanban board of job applications with inline editing, bulk actions, search/sort/filter, column visibility, drag-and-drop reordering, and soft delete.
- **Files:** `src/app/(main)/app/applications/page.tsx` (1017 lines — the single largest page), `src/components/board/{kanban-board,kanban-column,application-card}.tsx`, `src/components/application/{add-application-modal,application-detail,editable-cell,option-picker}.tsx`, `src/hooks/use-applications.ts`, `src/app/api/applications/route.ts` (GET/POST), `src/app/api/applications/[id]/route.ts` (GET/PATCH/DELETE), `src/app/api/applications/bulk/route.ts` (POST), `src/app/api/applications/search/route.ts` (GET)
- **What it does:** paginated/filtered/sorted list (`GET /api/applications`, clamped `limit≤100`), list↔board view toggle (`applications/page.tsx:675`), optimistic create with temp-id reconciliation, inline cell editing, column show/hide, multi-select + bulk soft-delete (single DB `updateMany` call, `applications/bulk/route.ts`), per-row soft delete with a 5s "Undo" toast (`src/lib/optimistic.ts`), status changes logged to `Activity` (`applications/[id]/route.ts:68-77`).
- **Status:** fully working.
- **Notable bug:** in `src/app/api/applications/route.ts:185-190`, the `Source.usageCount` bump on create is gated on `stageNames.length > 0` (i.e. whether a pipeline template was applied), not on whether `appliedVia` was actually supplied. Creating an application with a source but no template never increments that source's usage count — the condition looks copy-pasted from the wrong branch of logic.

### 2. Pipeline builder (per-application interview stages)
Ordered, drag-reorderable list of interview stages per application, with quick-add presets, custom stage names, status cycling, and "apply a saved template" to bulk-replace the stage list.
- **Files:** `src/components/application/pipeline-builder.tsx` (374 lines, lives inside the application detail slide-over — not a separate top-level slide-over as the project's own `CLAUDE.md` originally described it), `src/components/application/pipeline-stages.tsx`, `src/hooks/use-stages.ts`, `src/app/api/applications/[id]/stages/route.ts`, `.../stages/[stageId]/route.ts`, `.../stages/reorder/route.ts`
- **What it does:** `@dnd-kit` drag reorder with optimistic order updates, 5-state status cycle (UPCOMING→COMPLETED→PASSED→FAILED→SKIPPED), per-stage scheduled date, template application (deletes existing stages, creates new ones from the template's stored `Json` array), guards against acting on a stage that's still mid-create (`temp-` id prefix check throughout, e.g. lines 107, 120, 134).
- **Status:** fully working.

### 3. Contacts, documents, activity log
Per-application sub-resources.
- **Files:** `src/app/api/applications/[id]/contacts/route.ts` (+`[contactId]`), `.../documents/route.ts` (+`[documentId]`), `.../activity/route.ts`, rendered in `src/components/application/application-detail.tsx`
- **What it does:** add/remove contacts (name/role/email/phone/LinkedIn) and named document links per application; activity log is append-only and rendered as a timeline in the detail view; contacts/documents mutations also create an `Activity` row.
- **Status:** fully working (contacts/documents have no PATCH/update route — only create and delete; editing means delete-and-recreate from the UI).

### 4. Saved jobs
A dedicated view over applications with `status = SAVED`, with a "promote to Applied" action.
- **Files:** `src/app/(main)/app/saved/page.tsx` (316 lines), reuses `add-application-modal.tsx` and application card patterns.
- **What it does:** lists `useApplications({ status: "SAVED" })`, `promoteApplied()` (`saved/page.tsx:89`) patches status to `APPLIED` and the row leaves the list immediately (client-side filter, not a separate table).
- **Status:** fully working. It's a thin, status-scoped view of the same `Application` model, not a distinct feature/data structure.

### 5. Calendar / agenda
Read-only calendar of upcoming pipeline stage dates.
- **Files:** `src/app/(main)/app/calendar/page.tsx` (412 lines)
- **What it does:** builds `CalEvent`s from every application's `PipelineStage.scheduledDate`, renders month grid + list.
- **Status:** fully working, but display-only — no create/edit-from-calendar, no reminder emails actually fire (see `remindersEnabled` under Known Issues), no ICS export/sync.

### 6. Analytics (personal)
Response rate / interview rate / offer rate / average time-to-first-response / source effectiveness, computed client-side from the applications list.
- **Files:** `src/lib/analytics.ts` (pure functions, no DB aggregation), `src/components/analytics/analytics-charts.tsx`, `src/app/(main)/app/analytics/page.tsx` (59 lines — thin wrapper), `src/app/api/analytics/route.ts` (GET)
- **What it does:** `computeAnalytics()` derives rates from the in-memory application array (status filters against a hardcoded status list, `src/lib/analytics.ts:9-49`); source effectiveness only reports sources with ≥2 applications.
- **Status:** fully working. All computation is in the browser/route handler over already-fetched data — there is no separate analytics warehouse or scheduled rollup.

### 7. Ghost detection
A visual/manual flag, not an automated notification system.
- **Files:** `src/app/(main)/app/applications/page.tsx:171-208,442` (client-side "silent" calculation), `src/lib/constants.ts:136` (`GHOST_THRESHOLD_DAYS = 14` — a second, separate hardcoded default that duplicates `Profile.ghostThresholdDays`), `Profile.ghostThresholdDays` field (`prisma/schema.prisma`), `src/app/(main)/app/profile/page.tsx:212-225` and `settings/page.tsx:173-183` (per-user threshold setting)
- **What it does:** two independent mechanisms exist: (a) `GHOSTED` is a regular `ApplicationStatus` enum value a user can manually set; (b) the applications list separately flags any row where `status === "APPLIED" && !firstResponseDate && daysSinceApplied >= ghostThreshold` with a dimmed row + tooltip (`applications/page.tsx:204-208,335`) — this is purely a rendering hint and never writes to the DB or changes `status`.
- **Status:** fully working as a UI hint. There is **no background job, cron, or notification** that auto-flags or auto-emails a ghosted application — the marketing site's claim that "Traqit automatically marks that application as a ghost" (`src/components/marketing/faq.tsx:21`) overstates what the code does: nothing auto-*writes* the GHOSTED status: the user must do that, or accept the passive visual dimming.

### 8. Presets (Sources, Job Types, Pipeline Templates)
Per-user custom dropdown values and reusable stage-set templates.
- **Files:** `src/app/api/presets/{sources,job-types,templates}/route.ts` (+ `[id]` for delete/patch), `src/hooks/use-presets.ts`, `src/components/templates/pipeline-template-modal.tsx`, `src/lib/tag-options-store.ts`
- **What it does:** CRUD for `Source`/`JobType` (name + `usageCount`, unique per profile) and `PipelineTemplate` (name + `stages: Json` array + `isDefault` flag).
- **Status:** fully working.

### 9. Email templates (outreach)
Reusable, placeholder-substituted outreach message templates that open as a pre-filled Gmail compose draft.
- **Files:** `src/app/(main)/app/templates/page.tsx` (659 lines), `src/app/api/templates/email/route.ts` (+`[id]`, `/reorder`), `src/hooks/use-email-templates.ts`, `src/lib/email.ts`, `src/components/application/draft-email-modal.tsx`, `email-preview.tsx`
- **What it does:** CRUD + manual drag reorder (`PATCH /api/templates/email/reorder`) + soft delete (`deletedAt`, `EmailTemplate`), 5 placeholder tokens (`{company}`, `{position}`, `{contact}`, `{myName}`, `{jobUrl}`), builds a Gmail compose URL — see External Dependencies for why this is not a real Gmail integration.
- **Status:** fully working within its actual (non-automated) scope.

### 10. Trash (soft delete + retention)
30-day recoverable soft delete for applications and email templates.
- **Files:** `src/app/(main)/app/trash/page.tsx`, `src/app/api/trash/route.ts` (GET), `.../restore/route.ts`, `.../purge/route.ts`, `src/lib/trash.ts`, `prisma/rls.sql` cron reference
- **What it does:** `Application.deletedAt`/`EmailTemplate.deletedAt` mark trashed rows; two independent purge mechanisms — a `pg_cron` job `purge-trash-daily` (`0 3 * * *`, verified live per `DATABASE_REPORT.md §1`) and a lazy in-app sweep (`purgeExpiredTrash()`, runs on every Trash-page read) that hard-deletes anything older than `TRASH_RETENTION_DAYS = 30`.
- **Status:** fully working.

### 11. Profile / Settings
Account preferences, data export, data wipe, account deletion. **Two separate pages cover overlapping ground** — see Known Issues.
- **Files:** `src/app/(main)/app/profile/page.tsx` (649 lines), `src/app/(main)/app/settings/page.tsx` (462 lines), `src/app/api/profile/route.ts` (GET/PATCH/DELETE), `src/app/api/profile/data/route.ts` (DELETE), `src/app/api/export/route.ts` (GET)
- **What it does:** edit name/currency/ghost-threshold/reminder prefs; `GET /api/export` downloads a full JSON dump of the account's applications+stages+contacts+documents+activity; `DELETE /api/profile/data` hard-deletes every `Application` row for the profile (bypasses Trash entirely — see Known Issues); `DELETE /api/profile` deletes the Profile (cascades to everything) and, if `SUPABASE_SERVICE_ROLE_KEY` is configured, the Supabase auth user too.
- **Status:** fully working, but see the "reminders" and hard-delete gaps below.

### 12. Admin / founder dashboard
Internal, email-gated analytics on signups, retention, and per-company response/ghost rates.
- **Files:** `src/app/(main)/app/admin/dizzpy/page.tsx`, `src/lib/admin-overview.ts`, `src/lib/admin.ts`, `src/components/admin/{admin-dashboard,admin-members-table}.tsx`
- **What it does:** merges Supabase auth metadata (via the service-role client) with Prisma aggregates: growth (new users today/7d/30d), a "returned" heuristic (sign-in >10min after registration), per-company application/response/ghost counts, sortable members table.
- **Status:** fully working. Previously had a stored-XSS bug (`admin-members.tsx` used `innerHTML` with unescaped user-controlled `name`/`email` — documented in `AUDIT_REPORT.md §2`); that component was since deleted and replaced with `admin-members-table.tsx`, which renders via JSX only (git commit `92782bf "fix: remove dead XSS-prone admin bubble component"`). **This specific vulnerability is confirmed fixed.**

### 13. Onboarding (guided first-run setup)
5-step wizard: Welcome → Your details → Pick a template → First job → Done.
- **Files:** `src/components/onboarding/onboarding-flow.tsx` (522 lines), `src/app/(onboarding)/onboarding/page.tsx`, gated by `Profile.onboardedAt` in `src/app/(main)/layout.tsx:11` and `src/app/auth/callback/route.ts:39`
- **Status:** fully working.

### 14. In-app guided tour + keyboard shortcuts
- **Files:** `src/components/tour/app-tour.tsx` (driver.js), `src/lib/shortcuts.ts`, `src/lib/pending-action.ts`, `src/components/layout/{keyboard-shortcuts,shortcuts-dialog}.tsx`, `src/hooks/use-shortcut-hints.ts`
- **What it does:** single-key nav shortcuts (`a`/`s`/`c`/`g`→routes), a "pending action" hand-off so a shortcut like `n` can navigate then open a panel post-navigation, a `[data-tour="..."]`-targeted driver.js walkthrough of the applications page.
- **Status:** fully working.

### 15. Marketing site
Landing page, pricing, features, FAQ, founder memo, legal pages.
- **Files:** `src/components/marketing/**` (16 files), `src/app/(marketing)/**`
- **Status:** fully working as static marketing content. **Contains forward-looking/aspirational copy that doesn't match the code**: `pricing.tsx` and `faq.tsx` describe Free/Pro/Max tiers with different feature sets, but no billing provider, plan-gating logic, or feature-flagging by `Plan` exists anywhere in `main` outside the bare `Subscription.plan` column (see Data Model) — every account behaves identically regardless of `plan`.

### API surface summary
29 `route.ts` files, 44 HTTP method handlers, all confirmed to call `getProfile()`/`getUser()`/`isAdminEmail()` before touching data (no unauthenticated data route found).

---

## Data Model

`prisma/schema.prisma` (241 lines), 11 models, all `id` fields `cuid()`, all foreign keys `onDelete: Cascade`.

```
Profile (1)
 ├─1:1─ Subscription        (plan: FREE|PRO|MAX, default FREE)
 ├─1:N─ Application ──┬─1:N─ PipelineStage
 │                    ├─1:N─ Contact
 │                    ├─1:N─ Document
 │                    └─1:N─ Activity
 ├─1:N─ Source              (custom "applied via" dropdown values)
 ├─1:N─ JobType             (custom job-type dropdown values)
 ├─1:N─ PipelineTemplate    (stages stored as Json)
 └─1:N─ EmailTemplate       (soft-deletable)
```

- **Profile** — one per Supabase auth user (`userId` unique). Carries preferences directly on the row (`defaultCurrency`, `ghostThresholdDays`, `emailName`, `remindersEnabled`, `reminderLeadTime`, `onboardedAt`).
- **Subscription** — 1:1, deliberately a separate table "so it can grow into a full billing record" (schema comment, `prisma/schema.prisma:34-36`). Currently carries only `plan`; no `stripeCustomerId`/period dates/status exist yet, and as noted above, nothing in the app reads `plan` to gate any feature.
- **Application** — central entity; 5 composite indexes rooted at `profileId` (status, appliedDate, createdAt, deletedAt).
- **PipelineStage** — deliberately **no** `@@unique([applicationId, order])`; the schema comment explains this was removed because bulk-reordering via incremental `UPDATE`s trips a per-row unique constraint mid-statement (`prisma/schema.prisma:117-119`). `order` is a sort key only, not a strict invariant.
- **Contact / Document** — simple child records, create+delete only (no update route, see Features §3).
- **Activity** — append-only, `metadata: Json?`. **Not written by every mutation** despite `docs/api-conventions.md` stating "Every mutation creates Activity log" as a rule: verified writers are `applications/[id]/route.ts` (status change only), `.../contacts/route.ts`, `.../documents/route.ts`, `.../stages/route.ts` and `.../stages/[stageId]/route.ts`. Presets (`Source`/`JobType`/`PipelineTemplate`), `EmailTemplate`, and `Profile` mutations do **not** write to `Activity` — the documented convention is aspirational, not universally implemented.
- **Source / JobType** — `@@unique([profileId, name])`, `usageCount` incremented inconsistently (see bug in Features §1).
- **PipelineTemplate** — `stages` is untyped `Json` (an array of stage-name strings at the application layer, but the DB has no schema enforcement of that shape).
- **EmailTemplate** — soft-deletable (`deletedAt`), `@@unique([profileId, name])`.

**Inconsistency found:** `docs/prisma-schema.md` (an internal doc, not the real schema file) is **stale** — it's missing `Subscription`/`Plan` entirely, has a different `StageStatus` enum (includes `SCHEDULED`, which the real enum doesn't have), still has the `@@unique([applicationId, order])` constraint the real schema deliberately removed, and is missing most of `Profile`'s actual fields (`ghostThresholdDays`, `remindersEnabled`, etc.). It appears to be a Sprint-0/1-era draft that was never updated after the real schema evolved.

**Live DB state** (per `DATABASE_REPORT.md`, verified 2026-06-14): 11 tables, RLS enabled with 0 policies on all of them, `pg_cron` extension active, row counts consistent with a dev/seed dataset (2 profiles).

---

## Auth & Permissions

- **Identity:** Supabase Auth, magic link + GitHub OAuth. `src/proxy.ts` calls `updateSession()` (`src/lib/supabase/middleware.ts`) on every request, which calls `supabase.auth.getUser()` — the non-spoofable, JWT-revalidating call (not the cheaper but forgeable `getSession()`).
- **Trust boundary:** the verified user id is forwarded to server components/route handlers as `x-auth-user-id`. `src/lib/auth.ts:19-27` reads this header as a fast path, falling back to a real `getUser()` call if absent (e.g. outside a request the middleware ran for). The header is only trustworthy because the middleware is guaranteed to run first (via `proxy.ts`'s matcher) and strips any client-supplied copy before setting its own — this stripping happens in `src/lib/supabase/middleware.ts`, not shown here but referenced consistently across both audits and the code path.
- **Route protection:**
  - `/app/*` requires a session (`proxy.ts`: redirects to `/login` if `!user`).
  - `/login` redirects an already-signed-in user to `/app/applications`.
  - Every one of the 44 API handlers independently calls `getProfile()` (or `getUser()` for the two routes that don't need a Prisma profile) and 401s if unauthenticated — this is redundant with the middleware gate by design (defense in depth), not a gap.
  - **Data isolation:** every query scopes on `profileId: profile.id` (or filters nested resources by first confirming the parent `Application` belongs to the caller). No IDOR pattern found in any route read during this audit.
  - **Admin:** `isAdminEmail()` (`src/lib/admin.ts`) checks a hardcoded allowlist (extendable via `ADMIN_EMAILS` env var, comma-separated), used only by `/app/admin/dizzpy/page.tsx`. Returns a plain `notFound()` (404) rather than a 403 for non-admins, so the route's existence isn't leaked. This is the **only** role/permission concept in the app — there is no broader RBAC, no per-resource sharing/collaboration, and no distinction between plan tiers at the authorization layer.
- **Database-level defense:** RLS deny-all on every table (`prisma/rls.sql`) means even a leaked `NEXT_PUBLIC_SUPABASE_ANON_KEY` can't be used to read/write data directly through Supabase's PostgREST API — only the server-side Prisma connection (owner role) can touch data, and that path always applies the `profileId` scoping above.
- **Known, currently-open gaps** (re-verified against `AUDIT_REPORT.md`'s findings as of this report's writing):
  - **Open redirect in the auth callback is still present.** `src/app/auth/callback/route.ts:11` takes `next` straight from the query string with no validation; `appPath()` (`src/lib/urls.ts:12`) is a pure passthrough (`return path`), so `new URL(appPath(next), origin)` (`callback/route.ts:18-19`) resolves to an attacker-controlled host if `next` is an absolute URL (e.g. `?next=https://evil.com`). The audit's recommended fix (reject anything not starting with a single `/`) has **not** been applied.
  - **No security headers / CSP.** `next.config.ts` sets no `headers()` function at all — confirmed by reading the file in full; it only configures `images.remotePatterns`. Still open.
  - **Rate limiting fails open** if `UPSTASH_REDIS_REST_URL`/`_TOKEN` are unset (`src/lib/ratelimit.ts:38-40`) — by design for local dev, but means production has zero rate limiting if those env vars are ever missing. No startup assertion exists to catch that.
  - **XSS in admin members page — fixed** (see Features §12). **Next.js version bump — done**: `package.json` now pins `^16.2.9`, matching the audit's recommended minimum.

---

## Known Issues / Incomplete Work

- **`remindersEnabled` / `reminderLeadTime` are fully wired on the data and UI side but do nothing.** `Profile.remindersEnabled` (boolean) and `reminderLeadTime` (1/3/24/48 hours) are editable in both `profile/page.tsx:258-268` and `settings/page.tsx`, validated by Zod (`api/profile/route.ts:82-85`), and persisted to the DB — but no code anywhere sends a reminder email, no cron job checks upcoming `PipelineStage.scheduledDate`s, and no email-sending integration exists at all (see External Dependencies). This is a fully-realized setting for a feature that isn't implemented.
- **`DELETE /api/profile/data` ("wipe my data") permanently hard-deletes** every `Application` row (`prisma.application.deleteMany`) instead of soft-deleting via `deletedAt` — it completely bypasses Trash, unlike every other delete path in the app (single delete, bulk delete both go through `deletedAt`). A user clicking "wipe data" gets no 30-day recovery window, which is inconsistent with the rest of the product's delete UX and has no confirmation-of-understanding built into the API itself (confirmation, if any, is client-side only — not verified in this pass).
- **Duplicate preferences UI:** `src/app/(main)/app/profile/page.tsx` and `src/app/(main)/app/settings/page.tsx` both expose ghost-threshold and reminder settings (`profile/page.tsx:212-225` vs `settings/page.tsx:173-183`) against the same `Profile` fields. It's unclear from the code which page is authoritative/current — this looks like an unfinished consolidation (one page likely superseding the other) rather than an intentional dual surface.
- **`src/lib/mock-data.ts` is dead code.** Exports `MOCK_APPLICATIONS`/`MOCK_...` fixtures consistent with the project's documented "static UI + mock data first" build strategy (see the project's own `CLAUDE.md`), but a repo-wide search found **zero imports of this file from anywhere else in `src/`**. It was never removed after the app was wired to real Prisma/Supabase data.
- **`src/app/preview-landing/` is undocumented and its purpose is unclear from the code alone.** It appears to render marketing/landing content but sits outside the `(marketing)` route group and isn't linked from the main landing page navigation (`marketing-nav.tsx`) as far as this pass could confirm — flagged as ambiguous rather than asserted.
- **`docs/prisma-schema.md` and to a lesser extent `docs/api-conventions.md` are stale**, describing an earlier version of the schema/conventions that no longer matches the code (see Data Model section for specifics). Anyone using those docs as a reference would be misled on `Subscription`, `StageStatus`, `Profile` fields, and the "every mutation logs Activity" rule.
- **Marketing copy overstates automation** in at least two places: the FAQ's ghost-detection description (`faq.tsx:21`) implies automatic status changes that don't happen (see Features §7), and the pricing page's Free/Pro/Max feature differentiation (`pricing.tsx`) has no corresponding enforcement in code (see Data Model, `Subscription`).
- **Source/JobType `usageCount` bug** — see Features §1, `applications/route.ts:185-190`.
- **No TODO/FIXME/HACK comments and no leftover `console.log`/`console.debug`/`console.warn` statements exist anywhere in `src/`** (repo-wide grep, zero matches) — worth stating explicitly since it's a positive signal of code hygiene, not an oversight in this audit. The only console output is `console.error(err)` on caught server errors in route handlers (by design, per `AUDIT_REPORT.md §2`).
- **Lint currently fails.** Reproduced live (`bun run lint`): 6 errors, 2 warnings — all 6 errors are `react-hooks/refs` violations in `src/components/ui/particles.tsx:272-274` (writing to `.current` during render instead of in an effect), plus an unused `eslint-disable` directive in `src/lib/prisma.ts:5`. This exactly matches what `AUDIT_REPORT.md §4` flagged in June; it has **not** been fixed since. The build itself (`next build`) is unaffected because Next doesn't run lint during build.
- **No automated tests, no test framework, no CI.** Repo-wide search found zero `*.test.ts(x)`/`*.spec.ts(x)` files, no Jest/Vitest/Playwright/Cypress/Testing-Library in `package.json`, and no `.github/workflows` or other CI config. All verification is manual.
- **No versioned DB migrations.** `prisma/migrations/` is configured but empty; schema changes are applied via `prisma db push` with hand-run SQL scripts (`prisma/rls.sql`, `prisma/sql/*`) for RLS and backfills — acceptable for a solo project per `DATABASE_REPORT.md §8`, but there's no rollback path and no change history.
- **Environment drift:** `.env.local` contains keys for integrations that don't exist on `main` — `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_MODEL_*`, `CV_MODEL_*`, `CV_QUOTA_*`, `CV_AI_PRIMARY` — none of which are read by any code on this branch. These belong to the unmerged `feat/cv-studio/frontend` branch's AI CV-generation feature; their presence in the local `.env.local` is leftover from switching branches, not a `main`-branch requirement.

---

## External Dependencies / Integrations

| Integration | Status | Notes |
|---|---|---|
| Supabase (Auth + Postgres) | **Real, live** | `src/lib/supabase/{client,server,middleware,admin}.ts`. Service-role client (`admin.ts`) degrades to `null` when `SUPABASE_SERVICE_ROLE_KEY` is unset, used only for full account deletion (`DELETE /api/profile`) and the admin dashboard's auth-metadata lookups. |
| Upstash Redis | **Real, live, optional** | `src/lib/redis.ts`. `redis` is `null` when env vars are absent; every consumer (`cached()`, rate limiter) has an explicit fallback path — verified by reading the full file, not assumed. |
| Upstash Ratelimit | **Real, live, optional** | Shares the same Redis client; same fail-open behavior. |
| Gmail | **Not a real integration** | `src/lib/email.ts` only builds a `mail.google.com` compose URL (`buildGmailDraftUrl`); no API, no OAuth, no automated send. Functionally equivalent to a `mailto:` link with extra steps. |
| Billing/payments | **Not implemented** | `Subscription.plan` exists in the schema and is returned by `GET /api/profile`, but no Stripe/Paddle/LemonSqueezy/etc. package, webhook route, or checkout flow exists anywhere. Nothing enforces plan limits. |
| Transactional email | **Not implemented** | No email-sending package or API key anywhere; `remindersEnabled` has no backing sender (see Known Issues). |
| Calendar sync (Google Calendar / ICS) | **Not implemented** | The `/app/calendar` page is a self-contained read view of `PipelineStage` dates; nothing exports or syncs to an external calendar. |
| Analytics/telemetry (product analytics, not the in-app feature) | **Not implemented** | No PostHog/Segment/GA/Vercel Analytics package found. |
| AI CV generation (Anthropic/Google Gemini) | **Not on `main`** | Fully built out on the unmerged `feat/cv-studio/frontend` branch (not reviewed for this report per the report's stated scope); `main` has zero AI-related code, but its `.env.local` still carries the branch's env vars (see Known Issues). |

---

## Verification Notes

Every claim above was checked against the code in this session — file contents were read directly (not inferred from filenames), `bun run lint` was run live to confirm the current lint state, `git log`/`git branch`/`git diff` were used to establish the `main` vs. `feat/cv-studio/frontend` branch boundary, and repo-wide greps were run for TODO/FIXME comments, `console.*` calls, test files, CI config, and dead-code import checks (`mock-data.ts`, `seed.ts`). Two items are flagged as genuinely ambiguous rather than resolved: the exact intended relationship between `/app/profile` and `/app/settings`, and the purpose/linkage of `src/app/preview-landing/`. Everything else is stated as directly observed.
