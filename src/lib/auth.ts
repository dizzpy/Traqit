import type { User } from "@supabase/supabase-js";
import { prisma } from "./prisma";
import { seedProfile } from "./seed";
import { createClient } from "./supabase/server";
import { cached, cacheKey, TTL } from "./redis";

/**
 * Returns the Profile for the currently authenticated user, or null.
 * Identity comes from the verified Supabase session (auth.getUser), never from
 * a client-supplied cookie. Used by every API route to scope data.
 */
export async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  // Cache-backed: getProfile runs on every authenticated API request, so an
  // uncached findUnique here was a Postgres round-trip per request. Shares the
  // `cacheKey.profile` entry the /api/profile route already writes + invalidates.
  return cached(cacheKey.profile(user.id), TTL.PROFILE, () =>
    prisma.profile.findUnique({ where: { userId: user.id } })
  );
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
