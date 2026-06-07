import type { User } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { prisma } from "./prisma";
import { seedProfile } from "./seed";
import { createClient } from "./supabase/server";
import { cached, cacheKey, TTL } from "./redis";

const profileByUserId = (userId: string) =>
  // Cache-backed: getProfile runs on every authenticated API request, so an
  // uncached findUnique here was a Postgres round-trip per request. Shares the
  // `cacheKey.profile` entry the /api/profile route already writes + invalidates.
  cached(cacheKey.profile(userId), TTL.PROFILE, () =>
    prisma.profile.findUnique({ where: { userId } })
  );

/**
 * Returns the verified auth user id for the current request, or null.
 * Fast path: the `x-auth-user-id` header the middleware sets *after* validating
 * the JWT with Supabase — trusted because the middleware strips any client-sent
 * copy and only writes it for a verified session. Falls back to a real
 * getUser() round-trip when the header is absent (e.g. a context the middleware
 * didn't run for).
 */
async function getVerifiedUserId(): Promise<string | null> {
  try {
    const headerId = (await headers()).get("x-auth-user-id");
    if (headerId) return headerId;
  } catch {
    // headers() throws outside a request scope — fall through to getUser().
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Returns the Profile for the currently authenticated user, or null.
 * Identity comes from the verified Supabase session (never a client-supplied
 * value). Used by every API route to scope data.
 */
export async function getProfile() {
  const userId = await getVerifiedUserId();
  if (!userId) return null;
  return profileByUserId(userId);
}

/**
 * Finds the Profile linked to a Supabase user, creating + seeding one on first
 * login. Called from the auth callback after a session is established.
 */
export async function getOrCreateProfileForUser(user: User) {
  const existing = await prisma.profile.findUnique({
    where: { userId: user.id },
  });
  if (existing) return existing;

  const email = user.email ?? "";
  const meta = user.user_metadata ?? {};
  const name =
    (meta.user_name as string | undefined) ||
    (meta.full_name as string | undefined) ||
    (meta.name as string | undefined) ||
    email.split("@")[0] ||
    "User";

  const profile = await prisma.profile.create({
    data: { userId: user.id, email, name },
  });
  await seedProfile(profile.id);
  return profile;
}
