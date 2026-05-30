import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "auth-token";
const PROFILE_COOKIE = "profile-id";

const PUBLIC_PATHS = ["/login", "/api/auth"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/fonts") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const password = process.env.AUTH_PASSWORD;

  if (!password || token !== password) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated but no profile selected, send back to login (which
  // creates/selects the profile and sets the cookie). No separate picker page.
  if (!pathname.startsWith("/api")) {
    const profileId = req.cookies.get(PROFILE_COOKIE)?.value;
    if (!profileId && pathname !== "/login") {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
