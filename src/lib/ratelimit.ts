import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

/**
 * Sliding-window rate limiters, sharing the same Upstash client as the cache.
 * Like `redis`, these are null when Upstash isn't configured — in that case the
 * helper below fails OPEN (allows the request) so local/dev never breaks. A rate
 * limiter must never take the whole app down because of a cache outage.
 *
 * Two tiers:
 *  - `api`   : generous, for ordinary reads/navigation.
 *  - `write` : stricter, for POST/PUT/PATCH/DELETE (the expensive, abusable ops).
 */
export const limiters = redis
  ? {
      api: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "60 s"),
        prefix: "rl:api",
        analytics: false,
      }),
      write: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, "60 s"),
        prefix: "rl:write",
        analytics: false,
      }),
    }
  : null;

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // epoch ms when the window resets
};

/**
 * Check a request against the given tier for `identifier` (user id or IP).
 * Returns `success: true` (fail-open) when Upstash isn't configured or errors,
 * so a cache problem never blocks legitimate traffic.
 */
export async function checkRateLimit(
  tier: "api" | "write",
  identifier: string
): Promise<RateLimitResult> {
  if (!limiters) {
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }
  try {
    const { success, limit, remaining, reset } = await limiters[tier].limit(identifier);
    return { success, limit, remaining, reset };
  } catch {
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }
}
