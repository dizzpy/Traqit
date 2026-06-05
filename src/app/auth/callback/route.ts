import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfileForUser } from "@/lib/auth";
import { appPath } from "@/lib/urls";

/**
 * OAuth / magic-link callback. Supabase redirects here with a `code` which we
 * exchange for a session (PKCE), then create the user's profile on first login.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app/applications";

  if (!code) {
    return NextResponse.redirect(appPath("/login?error=auth"));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(appPath("/login?error=auth"));
  }

  let profile;
  try {
    profile = await getOrCreateProfileForUser(data.user);
  } catch {
    return NextResponse.redirect(appPath("/login?error=profile"));
  }

  // New (or not-yet-onboarded) users go through the guided setup first.
  if (!profile.onboardedAt) {
    return NextResponse.redirect(appPath("/onboarding"));
  }

  return NextResponse.redirect(appPath(next));
}
