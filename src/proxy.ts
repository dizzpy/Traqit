import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { checkRateLimit } from "@/lib/ratelimit";

// Methods that mutate state get the stricter `write` tier.
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function clientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Paths reachable without an authenticated session.
const PUBLIC_PATHS = ["/", "/login", "/auth", "/preview-landing", "/privacy", "/terms", "/cookies"];

// Static asset files (images, fonts, etc.) are always public. Next's image
// optimizer fetches these source URLs through the middleware, so gating them
// breaks <Image> on the marketing pages for signed-out visitors.
const PUBLIC_FILE =
  /\.(?:png|jpe?g|gif|svg|webp|avif|ico|css|js|map|woff2?|ttf|otf|eot|mp4|webm|txt|xml|json)$/i;

function isPublic(pathname: string) {
  return (
    PUBLIC_FILE.test(pathname) ||
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/fonts") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.svg" ||
    pathname === "/apple-icon.png" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}

export async function proxy(req: NextRequest) {
  const { supabaseResponse, user } = await updateSession(req);
  const { pathname } = req.nextUrl;

  // Rate-limit the API surface only (navigation + static assets are untouched).
  // Key by user id when signed in (fair per-account limit), else by client IP.
  if (pathname.startsWith("/api/")) {
    const identifier = user?.id ?? `ip:${clientIp(req)}`;
    const tier = WRITE_METHODS.has(req.method) ? "write" : "api";
    const rl = await checkRateLimit(tier, identifier);
    if (!rl.success) {
      const retryAfter = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000));
      return NextResponse.json(
        { error: "Too many requests", code: "RATE_LIMITED" },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(rl.limit),
            "X-RateLimit-Remaining": String(rl.remaining),
            "X-RateLimit-Reset": String(rl.reset),
          },
        }
      );
    }
  }

  // Signed-in users have no reason to see the login page.
  if (user && pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/app/applications";
    return NextResponse.redirect(url);
  }

  // /app/* always requires a verified session.
  if (pathname.startsWith("/app/") && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Legacy: protect anything non-public that isn't already covered above.
  if (!user && !isPublic(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|robots.txt|sitemap.xml).*)",
  ],
};
