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

  // If authenticated but no profile selected, redirect to profile picker
  // (skip for API routes — they handle this themselves)
  if (!pathname.startsWith("/api")) {
    const profileId = req.cookies.get(PROFILE_COOKIE)?.value;
    if (!profileId && pathname !== "/select-profile") {
      const profileUrl = req.nextUrl.clone();
      profileUrl.pathname = "/select-profile";
      return NextResponse.redirect(profileUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
