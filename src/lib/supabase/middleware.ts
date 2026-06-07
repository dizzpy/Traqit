import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie on every request and returns the
 * verified user. Must be called from the root middleware so tokens stay fresh
 * and Server Components always see a valid session.
 *
 * Returns the (possibly cookie-mutated) response and the verified user, or null.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() revalidates the token with Supabase. Do not replace
  // with getSession(), which only reads the (spoofable) cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Forward the *verified* identity to downstream server code as trusted request
  // headers, so getProfile() can scope data without paying a second getUser()
  // round-trip per request. We always overwrite (when signed in) or strip (when
  // not) these headers, so a client can never spoof them — only this middleware,
  // which has just validated the JWT with Supabase, can set them.
  const forwardedHeaders = new Headers(request.headers);
  if (user) {
    forwardedHeaders.set("x-auth-user-id", user.id);
    if (user.email) forwardedHeaders.set("x-auth-user-email", user.email);
    else forwardedHeaders.delete("x-auth-user-email");
  } else {
    forwardedHeaders.delete("x-auth-user-id");
    forwardedHeaders.delete("x-auth-user-email");
  }

  // Rebuild the response so the forwarded headers reach Server Components / Route
  // Handlers, carrying over any refreshed auth cookies setAll() accumulated.
  const finalResponse = NextResponse.next({ request: { headers: forwardedHeaders } });
  supabaseResponse.cookies.getAll().forEach((cookie) => finalResponse.cookies.set(cookie));

  return { supabaseResponse: finalResponse, user };
}
