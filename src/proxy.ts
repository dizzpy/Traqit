import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Paths reachable without an authenticated session.
const PUBLIC_PATHS = ["/", "/login", "/auth", "/preview-landing"];

function isPublic(pathname: string) {
  return (
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
