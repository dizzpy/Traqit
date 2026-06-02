# Production Readiness Audit Report
Generated: 2026-06-01

## Architecture (current)

```
Browser (React/Next.js App Router)
   |  SSR/CSR
   v
Next.js App (src/app)
   |-- Middleware: Supabase session refresh + auth gate
   |-- API Route Handlers (src/app/api/*)
   v
Prisma Client (src/lib/prisma.ts)
   v
Supabase Postgres (DATABASE_URL / DIRECT_URL)

Supabase Auth (SSR + browser clients)
   |-- Login page -> Supabase OAuth/OTP
   |-- /auth/callback -> exchange code, allowlist gate, profile seed
```

## Tech stack / infrastructure

- **Frontend**: Next.js App Router, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js Route Handlers in `src/app/api/*`
- **Auth**: Supabase Auth (SSR + browser clients), middleware session refresh
- **Database**: Supabase Postgres accessed via Prisma (@prisma/adapter-pg)
- **Infra/Deploy**: No Dockerfile or deployment config found

## Issues Found (by severity)

### Critical

1. **Secrets committed in repo (.env)**
   - **Risk**: Full database and auth compromise (DB creds + service-role key).
   - **Evidence**: `/.env`
     ```
     DATABASE_URL="postgresql://postgres...:6543/postgres?pgbouncer=true"
     DIRECT_URL="postgresql://postgres...:5432/postgres"
     NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
     SUPABASE_SERVICE_ROLE_KEY="..."
     ```

2. **Row Level Security effectively bypassed**
   - **Risk**: Any auth bug or ID leakage can expose all tenant data.
   - **Evidence**:
     - `/.env` uses the `postgres` user (superuser) in `DATABASE_URL` / `DIRECT_URL`.
     - Prisma connects directly using `process.env.DATABASE_URL` (`src/lib/prisma.ts`).
   - **Note**: RLS is not enforced for superuser connections; policies are not defined in this repo.

3. **Authorization gap: stage delete does not verify stage ownership**
   - **Risk**: A logged-in user could delete another user's stage if a `stageId` is known.
   - **Evidence**: `src/app/api/applications/[id]/stages/[stageId]/route.ts`
     ```
     await prisma.pipelineStage.delete({ where: { id: stageId } });
     ```

### High

1. **No migration/rollback strategy**
   - **Risk**: Schema changes cannot be safely promoted or rolled back in production.
   - **Evidence**: No `prisma/migrations` directory; only `prisma/schema.prisma` exists.

2. **Unbounded database queries**
   - **Risk**: Large responses and DB load spikes; potential timeouts.
   - **Evidence examples**:
     - `src/app/api/analytics/route.ts`
       ```
       prisma.application.findMany({ where: { profileId: profile.id }, include: {...} })
       ```
     - `src/app/api/presets/templates/route.ts`
       ```
       prisma.pipelineTemplate.findMany({ where: { profileId: profile.id } })
       ```
     - `src/app/api/applications/[id]/activity/route.ts`
       ```
       prisma.activity.findMany({ where: { applicationId: id } })
       ```

3. **Missing error handling in several async route handlers**
   - **Risk**: Unhandled exceptions return 500s without consistent logging or sanitization.
   - **Evidence examples**:
     - `src/app/api/presets/templates/route.ts` (GET/POST)
     - `src/app/api/templates/email/route.ts` (GET/POST)
     - `src/app/api/applications/[id]/activity/route.ts` (GET)

4. **No health check endpoint**
   - **Risk**: Inability to detect production failures quickly or integrate with monitoring.

### Medium

1. **No structured logging**
   - **Risk**: Difficult to trace errors; sensitive data could be logged.
   - **Evidence**: Multiple `console.error(err)` usages across route handlers.

2. **Environment separation missing**
   - **Risk**: Dev/prod values can be mixed; accidental production impact.
   - **Evidence**: Only `.env` / `.env.example` present.

3. **No deployment config**
   - **Risk**: Inconsistent or ad-hoc deployments.
   - **Evidence**: No Dockerfile or infra config in repo root.

4. **Potential race on stage insertion order**
   - **Risk**: Concurrent inserts can create inconsistent `order` values.
   - **Evidence**: `src/app/api/applications/[id]/stages/route.ts` updates order then inserts without a transaction.

### Low

- No low-severity items found that affect launch readiness beyond the above.

