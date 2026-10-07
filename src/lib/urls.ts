
/**
 * URL helpers. Previously used for cross-subdomain redirects (`app.*` vs
 * `traqit.*`). Now that everything lives on one domain these return relative
 * paths, kept in place so call sites compile without further changes.
 */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

const SAFE_DEFAULT_PATH = "/app/applications";

// Must start with exactly one `/` then a char that isn't `/` or `\`. Blocks
// absolute URLs, `//evil.com`, and `/\evil.com` — the WHATWG URL parser
// normalizes a leading backslash to `/`, so `new URL("/\\evil.com", origin)`
// resolves to `http://evil.com/`, same as the protocol-relative form.
const SAFE_RELATIVE_PATH = /^\/[^/\\]/;

/**
 * Relative path helper, e.g. `appPath("/login")` → `"/login"`.
 *
 * Also the guard against open redirects: callers feed this untrusted values
 * (e.g. the `next` query param on the auth callback), so anything that isn't
 * a genuine single-slash-prefixed relative path falls back to a safe internal
 * path instead of being followed.
 */
export function appPath(path = "") {
  if (path === "/") return path;
  if (!SAFE_RELATIVE_PATH.test(path)) return SAFE_DEFAULT_PATH;
  return path;
}

/** Relative path helper, e.g. `sitePath("/")` → `"/"`. */
export function sitePath(path = "") {
  return path;
}
