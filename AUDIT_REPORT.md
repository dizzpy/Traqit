# InternTracker (traqit) — Production Readiness & Security Audit

**Date:** 2026-06-14
**Reviewer:** Claude (Opus 4.8)
**Scope:** Full app — features, API surface, auth/security, state management, build, dependencies. Includes the new Subscription/plan-tier work.

---

## TL;DR — Verdict

**Status: Almost ready. Ship-blocking items are small and fixable in well under a day.**

- ✅ **Production build passes** (`bun run build` succeeds, all 29 API routes + pages compile).
- ✅ **Core security model is solid**: every API route is authenticated, all data access is ownership-scoped, RLS is deny-all, the service-role key is server-only, secrets are git-ignored.
- ⚠️ **3 things to fix before public launch** (details below):
  1. **Stored XSS** in the admin members page (user-controlled name/email → `innerHTML`).
  2. **Next.js 16.2.1 has known CVEs** including *middleware/proxy bypass* — and this app's auth gating lives in middleware. Bump to ≥ 16.2.9.
  3. **Pending DB migrations** for the new Subscription table are not yet applied (`db:push` + `rls.sql` + backfill).
- 🔧 A few hardening items + a lint failure to clean up (non-blocking for build, blocks CI).

---

## 1. Features — what's built

### App pages (`src/app/(main)/app/*`)
| Area | Route | Status |
|---|---|---|
| Dashboard / greeting | `/app` | ✅ Done |
| Applications (dense list) | `/app/applications` | ✅ Done |
| Saved jobs | `/app/saved` | ✅ Done |
| Calendar / agenda | `/app/calendar` | ✅ Done |
| Analytics | `/app/analytics` | ✅ Done |
| Email templates | `/app/templates` | ✅ Done |
| Profile | `/app/profile` | ✅ Done |
| Settings | `/app/settings` | ✅ Done |
| Trash (soft-delete, 30-day) | `/app/trash` | ✅ Done |
| Admin members (email-gated) | `/app/admin/dizzpy` | ✅ Done (see XSS finding) |
| Onboarding (guided) | `/onboarding` | ✅ Done |
| Marketing + legal | `/`, `/privacy`, `/terms`, `/cookies` | ✅ Done |
| Auth | `/login`, `/auth/callback`, `/auth/signout` | ✅ Done |

### API surface (29 route handlers, all authenticated)
- **Applications**: list (paginated, filtered, cached), create, get, update, soft-delete, bulk-trash, search.
- **Nested resources**: stages (+ reorder), contacts, documents, activity — all parent-ownership checked.
- **Presets**: sources, job types, pipeline templates (CRUD).
- **Email templates**: CRUD + reorder.
- **Profile**: get/update/delete-account, wipe-data, full data export (JSON).
- **Trash**: list, restore, purge.
- **Analytics / timeline**.

### Infrastructure (done right)
- **Auth**: Supabase (magic link + GitHub OAuth), JWT revalidated via `getUser()` in middleware (`src/lib/supabase/middleware.ts`), verified identity forwarded as trusted `x-auth-user-id` header (client copies stripped).
- **Caching**: Upstash Redis layer with TTLs + scoped invalidation (`src/lib/redis.ts`), fails open.
- **Rate limiting**: sliding-window, per-user/per-IP, write tier stricter (`src/lib/ratelimit.ts`, applied in `src/proxy.ts`).
- **Soft delete + Trash** with optimistic UI + undo, pg_cron purge.
- **State**: SWR for reads, explicit mutators for writes, optimistic insert/reconcile.

### New: Subscription / plan tier (this session)
- `Plan` enum (FREE/PRO/MAX) + `Subscription` table (1:1 with Profile, default FREE), auto-created on signup, exposed on `GET /api/profile` as `plan`.
- **Code complete & type-checks**, but **DB not yet migrated** — see §6.

---

## 2. Security audit

### 🔴 HIGH — Stored XSS in admin members page
**File:** `src/components/admin/admin-members.tsx` (lines ~74–75, ~208–209, ~301)

User-controlled `name` and `email` are interpolated straight into `innerHTML`:
```js
el.innerHTML = `<div class="label">${u.name}</div>`;        // line 75
panel.innerHTML = `<div class="p-name">${u.name}</div>
                   <div class="p-email">${u.email}</div>`;  // lines 208-209
```
`name` is freely set by any user (onboarding + `PATCH /api/profile`, max 60 chars, **no character validation**). A user setting their display name to an `<img src=x onerror=...>` payload gets script execution **in an admin's browser** when the admin opens `/app/admin/dizzpy` — i.e. it targets your most privileged accounts (session theft, admin actions).

**Fix:** Don't build this DOM with `innerHTML` from dynamic values. Either:
- Render the member nodes/panel with React/JSX (preferred), or
- HTML-escape every interpolated value, e.g. a small `esc()` helper, and set text via `textContent` for `name`/`email`/`id`.

### 🔴 HIGH — Next.js 16.2.1 has known CVEs (incl. middleware bypass)
`npm audit` reports 5 advisories (1 high, 4 moderate) against the pinned `next@16.2.1`, including:
- **Middleware/Proxy bypass** (`GHSA-492v-c6pp-mqqv`, `GHSA-267c-6grr-h53f`) — **directly relevant**: this app enforces auth gating *and* rate limiting in middleware (`src/proxy.ts`). A bypass could expose `/app/*` or skip rate limits.
- SSRF via WebSocket upgrades, image-optimization DoS, RSC cache poisoning, + a transitive PostCSS XSS.

**Fix:** Bump Next to **≥ 16.2.9** (`package.json` currently pins exactly `16.2.1`). It's a patch-level bump within 16.2.x — low risk. Re-run `npm audit` after.

### 🟠 MEDIUM — Open redirect in auth callback
**File:** `src/app/auth/callback/route.ts:43` → `redirectTo(next)` → `new URL(appPath(next), origin)` where `appPath()` returns its input unchanged (`src/lib/urls.ts:12`).

If `next` is an absolute URL (`?next=https://evil.com`), `new URL("https://evil.com", origin)` resolves to the attacker's host → open redirect (phishing). Exploitability is limited (needs a valid auth `code`), but the pattern is unsafe.

**Fix:** Validate `next` is a local path before redirecting — reject anything not starting with a single `/` (and not `//` or containing `:`).

### 🟠 MEDIUM — Rate limiting fails open on missing config
**File:** `src/lib/ratelimit.ts:47` — when `UPSTASH_*` env vars are absent, `checkRateLimit` returns `success: true` for everything. This is correct for local dev, but means **production has zero rate limiting if those env vars aren't set**. The auth `getUser()` and middleware similarly depend on env.

**Fix:** Ensure `UPSTASH_REDIS_REST_URL` / `_TOKEN` are set in production, and consider a startup assertion (fail loud) when `NODE_ENV === "production"` and they're missing.

### 🟡 LOW / Hardening
- **No security headers / CSP** (`next.config.ts` sets no `headers()`). A Content-Security-Policy would have blunted the XSS above. Add CSP, `X-Frame-Options: DENY` (or `frame-ancestors`), `X-Content-Type-Options: nosniff`, `Referrer-Policy`.
- **CSRF**: state-changing routes rely on the Supabase session cookie with no CSRF token. Supabase cookies default to `SameSite=Lax`, which blocks cross-site POST/fetch — acceptable, but **verify SameSite is Lax/Strict in production** and don't loosen it.
- **Error logging**: routes `console.error(err)` raw errors server-side (e.g. `applications/route.ts:198`). Fine for now; ensure logs aren't shipped somewhere world-readable, and never echo internal errors to clients (currently they return a generic `"Server error"` — good).
- **Admin allowlist** is hardcoded + env-extendable (`src/lib/admin.ts`) — good. Keep it that way (never client-derived).

### ✅ Security done well (no action needed)
- Every one of the 29 API routes calls `getProfile()` / `getUser()` / `isAdminEmail()` — **no unauthenticated data routes**.
- **Consistent ownership scoping**: reads/writes filter on `profileId: profile.id`; nested resources verify the parent application belongs to the caller before touching children (no IDOR). Bulk/wipe use `updateMany`/`deleteMany` scoped to the profile.
- **RLS deny-all** on every table (`prisma/rls.sql`); Prisma connects as `postgres` owner, anon PostgREST role is locked out.
- **Service-role key is server-only** (`src/lib/supabase/admin.ts`), never `NEXT_PUBLIC`, degrades to null.
- **Secrets git-ignored** (`.env*`), none tracked in git.
- **Input validation** via Zod on all write routes; **pagination clamped** (`limit` ≤ 100, `page` ≥ 1) to prevent table-dump.
- **`getUser()` (not `getSession()`)** is used to revalidate JWTs — the correct, non-spoofable choice.

---

## 3. State management review

**Architecture:** SWR for server-state reads (`src/hooks/use-*.ts`), thin async mutators for writes, optimistic updates with `tempId()` reconciliation (`src/lib/optimistic.ts`), `sonner` toasts with Undo. No global client store — appropriate for this app; server is the single source of truth, cache invalidation is centralized in `src/lib/redis.ts`.

**Assessment: healthy.** Notes / minor items:
- ✅ `useApplications` exposes both a bound `mutate` (single key) and `revalidateAll` (all `/api/applications*` keys) — clean handling of nested-write invalidation.
- ✅ Optimistic placeholders are fully-shaped objects with temp ids; `isTempId()` guards prevent acting on un-persisted rows.
- 🟡 The new `plan` field is now returned by `GET /api/profile` but **`use-profile.ts` / the `Profile` type may not surface it yet** — wire it through if any UI needs to read the tier (currently out of scope; data-model only).
- 🟡 SWR `fetcher` throws a generic `Error("Fetch error")` and doesn't special-case `401`/`429`; consider redirecting to `/login` on 401 and surfacing `Retry-After` on 429 for nicer UX.
- 🟡 Two-layer cache (SWR client + Redis server) means a write must invalidate both. Mutators do call `invalidateAppData`/SWR `mutate`, but this is the area most prone to subtle staleness bugs — worth a focused test pass.

---

## 4. Build & code quality

- ✅ **`bun run build` succeeds** — production-deployable.
- ✅ **`tsc --noEmit` passes** (0 errors) including the new Subscription types.
- 🟡 **`bun run lint` fails: 6 errors, 2 warnings.** Build doesn't run lint so this isn't ship-blocking, but **it will fail CI**:
  - 4× `react-hooks/refs` "Cannot update ref during render" in `src/components/ui/particles.tsx:272–274` (decorative component).
  - Unused `eslint-disable` in `src/lib/prisma.ts:5`.
  - **Fix:** move the ref assignments in `particles.tsx` into an effect; remove the stale disable directive.

---

## 5. Subscription feature — applied status

**✅ Now applied in production** (verified live 2026-06-14 via DB inspection — see `DATABASE_REPORT.md`): the `Subscription` table exists with RLS enabled and **2 rows** (backfilled, one per profile), and the `Plan` enum is present. The three DB steps below have been completed:
1. ~~`bun run db:push`~~ — table created. ✔
2. ~~Re-run `prisma/rls.sql`~~ — RLS enabled on the new table. ✔
3. ~~`prisma/sql/backfill_subscriptions.sql`~~ — existing users have a FREE row. ✔

`GET /api/profile` returns the live `plan`; new signups create their FREE row on first login.

---

## 6. Prioritized action list

**Must do before public launch:**
- [ ] Fix stored XSS in `admin-members.tsx` (escape/`textContent` or render via JSX).
- [ ] Upgrade `next` to ≥ 16.2.9; re-run `npm audit`.
- [x] ~~Apply the 3 Subscription DB steps~~ — done & verified live (§5).
- [ ] Confirm production env vars set: `UPSTASH_REDIS_REST_URL/_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`/`DIRECT_URL`, Supabase URL/anon key.

**Should do (this week):**
- [ ] Validate `next` redirect param in `auth/callback`.
- [ ] Add security headers + a CSP in `next.config.ts`.
- [ ] Fix the 6 lint errors so CI is green.
- [ ] Verify Supabase auth cookie `SameSite`.

**Nice to have:**
- [ ] SWR 401/429 handling for nicer UX.
- [ ] Focused test pass on the SWR↔Redis dual-cache invalidation.
- [ ] Startup assertion that fails loud if prod is missing rate-limit/env config.

---

## 7. Overall

A genuinely well-built app: clean auth model, consistent authorization, real caching + rate limiting, soft-delete, and a thoughtful optimistic-UI layer. The architecture is production-grade. The blockers are narrow and concrete — one XSS sink, one dependency bump, and the pending DB migration. Knock those out and it's ready to publish.
