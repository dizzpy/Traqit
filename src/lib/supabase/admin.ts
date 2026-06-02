import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for privileged server-only operations (e.g.
 * deleting an auth user). Returns null when SUPABASE_SERVICE_ROLE_KEY isn't
 * configured, so callers can degrade gracefully. NEVER import this from client
 * components — the service-role key bypasses all row-level security.
 */
export function createAdminClient(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
