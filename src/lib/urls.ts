
/**
 * Cross-subdomain URL helpers.
 *
 * The app and the marketing site share one Vercel deployment but live on
 * different hosts (`app.traqit.*` vs `traqit.*`). Redirects that must land on a
 * specific subdomain build absolute URLs from these env-driven bases. On
 * localhost both fall back to the dev origin, so the single-domain dev workflow
 * is unchanged.
 */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Absolute URL on the app subdomain, e.g. `appPath("/login")`. */
export function appPath(path = "") {
  return `${APP_URL}${path}`;
}

/** Absolute URL on the marketing subdomain, e.g. `sitePath("/")`. */
export function sitePath(path = "") {
  return `${SITE_URL}${path}`;
}
