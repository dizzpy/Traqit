
/**
 * URL helpers. Previously used for cross-subdomain redirects (`app.*` vs
 * `traqit.*`). Now that everything lives on one domain these return relative
 * paths, kept in place so call sites compile without further changes.
 */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

/** Relative path helper, e.g. `appPath("/login")` → `"/login"`. */
export function appPath(path = "") {
  return path;
}

/** Relative path helper, e.g. `sitePath("/")` → `"/"`. */
export function sitePath(path = "") {
  return path;
}
