import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Paths reachable without an authenticated session.
const PUBLIC_PATHS = ["/login", "/auth"];

function isPublic(pathname: string) {
  return (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/fonts") ||
    pathname === "/favicon.ico"
  );
}

export async function middleware(req: NextRequest) {
  // Refresh the session cookie and read the verified user on every request.
  const { supabaseResponse, user } = await updateSession(req);
  const { pathname } = req.nextUrl;

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
