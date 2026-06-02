import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfileForUser, isEmailAllowed } from "@/lib/auth";

/**
 * OAuth / magic-link callback. Supabase redirects here with a `code` which we
 * exchange for a session (PKCE). This is the authoritative allowlist gate:
 * a non-allowlisted user is signed out before any profile is created.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/applications";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  if (!isEmailAllowed(data.user.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=not_allowed`);
  }

  let profile;
  try {
    profile = await getOrCreateProfileForUser(data.user);
  } catch {
    return NextResponse.redirect(`${origin}/login?error=profile`);
  }

  // New (or not-yet-onboarded) users go through the guided setup first.
  if (!profile.onboardedAt) {
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
