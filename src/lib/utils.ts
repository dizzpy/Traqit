import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, differenceInDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeDate(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "MMM d, yyyy");
}

export function daysBetween(
  from: string | Date | null,
  to: string | Date | null
): number | null {
  if (!from || !to) return null;
  return differenceInDays(new Date(to), new Date(from));
}

export function daysUntil(date: string | Date | null): number | null {
  if (!date) return null;
  return differenceInDays(new Date(date), new Date());
}

export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function apiResponse<T>(data: T, status = 200): Response {
  return Response.json({ data }, { status });
}

export function apiError(message: string, code: string, status: number): Response {
  return Response.json({ error: { message, code } }, { status });
}
