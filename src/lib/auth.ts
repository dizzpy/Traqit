import type { User } from "@supabase/supabase-js";
import { prisma } from "./prisma";
import { seedProfile } from "./seed";
import { createClient } from "./supabase/server";

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
  return prisma.profile.findUnique({ where: { userId: user.id } });
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

/**
 * True if the email is permitted to sign in. The app is private to a fixed set
 * of users defined in ALLOWED_EMAILS (comma-separated). If the var is unset,
 * sign-in is denied — fail closed rather than open.
 */
export function isEmailAllowed(email: string | undefined | null): boolean {
  if (!email) return false;
  const allowed = (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return false;
  return allowed.includes(email.trim().toLowerCase());
}
