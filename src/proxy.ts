import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { APP_URL, SITE_URL } from "@/lib/urls";

// Build absolute URLs that cross the app / marketing subdomain boundary.
export function appUrl(path = "") {
  return `${APP_URL}${path}`;
}
export function siteUrl(path = "") {
  return `${SITE_URL}${path}`;
}

/**
 * Which subdomain served this request. `app.*` (and localhost in dev) is the
 * gated application; everything else is the public marketing site. Both the
 * current `*.encrivolabs.com` and the future `*.traqit.cc` domain pairs resolve
 * correctly with no code change.
 */
function getSubdomain(request: NextRequest): "app" | "marketing" | "unknown" {
  const host = request.headers.get("host") ?? "";
  if (host.startsWith("app.")) return "app";
  if (host === "localhost:3000" || host === "127.0.0.1:3000") return "app"; // dev default
  return "marketing";
}

// Paths reachable without an authenticated session (app subdomain only).
const PUBLIC_PATHS = ["/login", "/auth", "/preview-landing"];

function isPublic(pathname: string) {
  return (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/fonts") ||
    pathname === "/favicon.ico"
  );
}

export async function proxy(req: NextRequest) {
  // Refresh the session cookie and read the verified user on every request.
  const { supabaseResponse, user } = await updateSession(req);
  const { pathname } = req.nextUrl;
  const subdomain = getSubdomain(req);

  // Marketing site: fully public, no auth gate. It owns no API routes of its
  // own, so any /api/* hit is bounced to the app subdomain where the handlers
  // actually live.
  if (subdomain === "marketing") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.redirect(appUrl(pathname + req.nextUrl.search));
    }
    return supabaseResponse;
  }

  // The app subdomain has no landing of its own — the bare root belongs to the
  // marketing site, so `app.traqit.*/` bounces to `traqit.*/`. In dev both
  // resolve to the same origin; skip the cross-redirect there to avoid a loop
  // and keep the old behavior of dropping straight into the app.
  if (pathname === "/") {
    const marketingRoot = siteUrl("/");
    const sameOrigin =
      new URL(marketingRoot).host === (req.headers.get("host") ?? "");
    if (!sameOrigin) {
      return NextResponse.redirect(marketingRoot);
    }
    const url = req.nextUrl.clone();
    url.pathname = user ? "/applications" : "/login";
    return NextResponse.redirect(url);
  }

  // Signed-in users have no reason to see the login page.
  if (user && pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/applications";
    return NextResponse.redirect(url);
  }

  // Everything else requires a verified session.
  if (!user && !isPublic(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
