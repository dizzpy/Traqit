import { Redis } from "@upstash/redis";

/**
 * Upstash Redis client, or null when the env vars aren't configured. Keeping it
 * optional means the app runs identically with or without a cache: every helper
 * below falls back to the supplied fetcher (the DB) when `redis` is null or a
 * Redis call throws. A cache outage must never break a request.
 */
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
export const redis = url && token ? new Redis({ url, token }) : null;

/** TTLs in seconds, tuned to how often each kind of data actually changes. */
export const TTL = {
  PROFILE: 300, // 5 min  — changes rarely
  PRESETS: 600, // 10 min — sources, job types, pipeline templates
  TEMPLATES: 600, // 10 min — email templates
  ANALYTICS: 120, // 2 min  — acceptable staleness
  APPS_LIST: 30, // 30s    — changes often
} as const;

/**
 * Cache keys. ALWAYS scoped to the owning profile (or auth user id) so one
 * user can never read another user's data out of the cache.
 */
export const cacheKey = {
  profile: (userId: string) => `profile:${userId}`,
  apps: (profileId: string, qs: string) => `apps:${profileId}:${qs}`,
  sources: (profileId: string) => `presets:sources:${profileId}`,
  jobTypes: (profileId: string) => `presets:jobtypes:${profileId}`,
  pipTemplates: (profileId: string) => `presets:templates:${profileId}`,
  emailTemplates: (profileId: string) => `templates:email:${profileId}`,
  analytics: (profileId: string) => `analytics:${profileId}`,
};

/**
 * Get-or-set. Returns the cached value on a hit, otherwise runs `fetcher`,
 * stores the result with the given TTL, and returns it. Any Redis error is
 * swallowed and the fetcher result is used — the DB is always the source of
 * truth and the request never fails because of the cache.
 */
export async function cached<T>(key: string, ttl: number, fetcher: () => Promise<T>): Promise<T> {
  if (redis) {
    try {
      const hit = await redis.get<T>(key);
      if (hit !== null && hit !== undefined) return hit;
    } catch {
      // Redis unreachable — fall through to the DB.
    }
  }

  const data = await fetcher();

  if (redis) {
    try {
      await redis.set(key, data, { ex: ttl });
    } catch {
      // Non-fatal — still return the freshly fetched data.
    }
  }

  return data;
}

/** Delete specific keys. No-op when Redis isn't configured. */
export async function invalidate(...keys: string[]) {
  if (!redis || keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch {
    // Non-fatal — entries expire on their own via TTL.
  }
}

/**
 * Delete every applications-list entry for a profile (filters/sort/page each
 * produce a distinct key). Called after any application write.
 */
export async function invalidateAppsList(profileId: string) {
  if (!redis) return;
  try {
    // SCAN (cursor-based, non-blocking) instead of KEYS, which is O(keyspace)
    // and stalls Redis for every user when called on each write.
    const pattern = `apps:${profileId}:*`;
    let cursor = "0";
    const found: string[] = [];
    do {
      const [next, batch] = await redis.scan(cursor, { match: pattern, count: 100 });
      cursor = next;
      found.push(...batch);
    } while (cursor !== "0");
    if (found.length) await redis.del(...found);
  } catch {
    // Non-fatal — entries expire on their own via TTL.
  }
}

/**
 * Bust everything derived from a profile's applications: the list (all filter
 * variants) and the analytics rollup. Call after any application or stage
 * mutation so the next read reflects the change.
 */
export async function invalidateAppData(profileId: string) {
  await Promise.all([invalidateAppsList(profileId), invalidate(cacheKey.analytics(profileId))]);
}
