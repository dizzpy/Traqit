import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfileForUser } from "@/lib/auth";
import { appPath } from "@/lib/urls";

/**
 * OAuth / magic-link callback. Supabase redirects here with a `code` which we
 * exchange for a session (PKCE), then create the user's profile on first login.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app/applications";

  // NextResponse.redirect needs an absolute URL; resolve relative paths against
  // the request origin so the callback never throws (→ HTTP 500) on redirect.
  const redirectTo = (path: string) =>
    NextResponse.redirect(new URL(appPath(path), origin));

  if (!code) {
    return redirectTo("/login?error=auth");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return redirectTo("/login?error=auth");
  }

  let profile;
  try {
    profile = await getOrCreateProfileForUser(data.user);
  } catch {
    return redirectTo("/login?error=profile");
  }

  // New (or not-yet-onboarded) users go through the guided setup first.
  if (!profile.onboardedAt) {
    return redirectTo("/onboarding");
  }

  return redirectTo(next);
}
