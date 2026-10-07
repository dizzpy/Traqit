import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

/**
 * True when the request carries `Authorization: Bearer <CRON_SECRET>`.
 * Always false if CRON_SECRET isn't set, so an unconfigured deploy can't be
 * triggered by anyone.
 */
export function isAuthorizedCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
