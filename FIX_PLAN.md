# Fix Plan (Prioritized)

## Mandatory before launch

1. **Remove committed secrets and rotate credentials** (Effort: S)
   - **Steps**:
     1. Delete `.env` from the repository and keep it only locally.
     2. Rotate Supabase DB password and service-role key.
     3. Set secrets via environment variables in your deployment platform.
     4. Keep `.env.example` updated with required variables (placeholders only).

2. **Harden authorization for stage delete** (Effort: S)
   - **Steps**:
     1. Verify stage belongs to the application before delete.
     2. Reject if `stageId` is not linked to the application.

3. **Add consistent error handling for all async route handlers** (Effort: M)
   - **Steps**:
     1. Introduce a small API wrapper or helper to catch and sanitize errors.
     2. Replace `console.error` with structured logging helper.
     3. Ensure all route handlers return a safe `apiError(...)` response on failure.

4. **Add pagination or limits to all unbounded queries** (Effort: M)
   - **Steps**:
     1. Add `page`/`limit` query params or a fixed max limit.
     2. Return `total`, `page`, `limit` consistently.
     3. Keep defaults backward-compatible (small reasonable limits).

5. **Add a health check endpoint** (Effort: S)
   - **Steps**:
     1. Add `GET /api/health` returning `{ ok: true }`.
     2. Optionally include DB connectivity check.

6. **Enable RLS and least-privilege DB role** (Effort: L)
   - **Steps**:
     1. Create a non-superuser DB role for the app.
     2. Enable RLS on all tables and add policies on `profileId`.
     3. Update Prisma connection to use the least-privilege role.
   - **Note**: Requires Supabase SQL changes and policy review.

7. **Adopt Prisma migrations for safe rollbacks** (Effort: M)
   - **Steps**:
     1. Create initial migration from current schema.
     2. Store migrations in `prisma/migrations`.
     3. Update deployment to run `prisma migrate deploy`.

## Nice-to-have (post-launch hardening)

1. **Monitoring/alerting** (Effort: M)
   - Add APM or error tracking (Sentry/BetterStack/etc).
   - Configure uptime checks for `/api/health`.

2. **Deployment config** (Effort: M)
   - Add Dockerfile or platform-specific config.
   - Document environment-specific values.

