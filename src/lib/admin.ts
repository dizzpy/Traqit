/**
 * Admin allowlist. Only these verified Supabase emails may reach the admin
 * surfaces (e.g. /app/admin/dizzpy). Kept as a hardcoded set on purpose — the
 * list is tiny and we never want it derived from client-supplied data. Can be
 * extended via the ADMIN_EMAILS env var (comma-separated) without a redeploy.
 */
const BUILTIN_ADMINS = ["dizzzpy@gmail.com", "anujanisal19@gmail.com"];

const ADMIN_EMAILS = new Set(
  [...BUILTIN_ADMINS, ...(process.env.ADMIN_EMAILS?.split(",") ?? [])]
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

/** True when the given email belongs to an admin. Case-insensitive. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.toLowerCase());
}
