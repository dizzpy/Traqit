/**
 * Stage scheduling. A stage is either:
 *  - all-day (`hasTime: false`): `scheduledDate` holds the calendar date at
 *    00:00 UTC — only its yyyy-MM-dd part is meaningful, in any timezone; or
 *  - timed (`hasTime: true`): `scheduledDate` is the exact instant.
 *
 * All-day stages are treated as starting at ALL_DAY_START_HOUR in the user's
 * timezone for reminders and "upcoming" checks. Safe to import on client and
 * server (no server-only deps).
 */
import { format } from "date-fns";

export const ALL_DAY_START_HOUR = 9;

type Schedulable = { scheduledDate: string | Date | null; hasTime?: boolean };

const iso = (d: string | Date) => (typeof d === "string" ? d : d.toISOString());

/** True if `tz` is an IANA timezone this runtime understands. */
export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Offset of `timeZone` from UTC at `instant`, in milliseconds. */
function tzOffsetMs(timeZone: string, instant: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return asUtc - (instant - (instant % 1000));
}

/** The UTC instant of a wall-clock date + hour in `timeZone` (DST-safe). */
export function zonedWallTimeToUtc(
  date: string,
  hour: number,
  timeZone: string,
): Date {
  const [y, m, d] = date.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, hour);
  const first = guess - tzOffsetMs(timeZone, guess);
  // Re-check at the corrected instant in case it crossed a DST boundary.
  return new Date(guess - tzOffsetMs(timeZone, first));
}

/**
 * When the stage actually starts. `timeZone` is the user's IANA zone; for
 * all-day stages it decides when "09:00" is. Omit it in the browser to use the
 * browser's own zone. Returns null for unscheduled stages.
 */
export function stageStart(
  stage: Schedulable,
  timeZone?: string | null,
): Date | null {
  if (!stage.scheduledDate) return null;
  const value = iso(stage.scheduledDate);
  if (stage.hasTime) return new Date(value);
  const day = value.slice(0, 10);
  if (timeZone && isValidTimeZone(timeZone))
    return zonedWallTimeToUtc(day, ALL_DAY_START_HOUR, timeZone);
  if (timeZone !== undefined)
    return zonedWallTimeToUtc(day, ALL_DAY_START_HOUR, "UTC");
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d, ALL_DAY_START_HOUR);
}

/** The stage's calendar day ("yyyy-MM-dd") in the browser's timezone. */
export function stageLocalDay(stage: Schedulable): string {
  if (!stage.scheduledDate) return "";
  const value = iso(stage.scheduledDate);
  return stage.hasTime
    ? format(new Date(value), "yyyy-MM-dd")
    : value.slice(0, 10);
}

/** The stage's time ("HH:mm") in the browser's timezone, or "" if all-day. */
export function stageLocalTime(stage: Schedulable): string {
  if (!stage.scheduledDate || !stage.hasTime) return "";
  return format(new Date(iso(stage.scheduledDate)), "HH:mm");
}

/** A local Date for display/grouping: the exact time, or local midnight of the day. */
export function stageDisplayDate(stage: Schedulable): Date | null {
  if (!stage.scheduledDate) return null;
  if (stage.hasTime) return new Date(iso(stage.scheduledDate));
  const [y, m, d] = iso(stage.scheduledDate)
    .slice(0, 10)
    .split("-")
    .map(Number);
  return new Date(y, m - 1, d);
}

/**
 * API payload for a day ("yyyy-MM-dd" or "") and optional time ("HH:mm" or
 * ""), interpreted in the browser's timezone.
 */
export function toStageSchedule(
  day: string,
  time: string,
): { scheduledDate: string | null; hasTime: boolean } {
  if (!day) return { scheduledDate: null, hasTime: false };
  if (!time) return { scheduledDate: day, hasTime: false };
  return {
    scheduledDate: new Date(`${day}T${time}`).toISOString(),
    hasTime: true,
  };
}
