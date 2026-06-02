import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInCalendarDays, differenceInDays, format, formatDistanceToNow } from "date-fns"
import { NextResponse } from "next/server"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—"
  return format(new Date(date), "MMM d, yyyy")
}

export function formatRelativeDate(date: string | Date | null | undefined): string {
  if (!date) return "—"
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function daysUntil(date: string | Date | null | undefined): number | null {
  if (!date) return null
  return differenceInCalendarDays(new Date(date), new Date())
}

export function apiError(message: string, code: string, status: number) {
  return NextResponse.json({ error: { message, code } }, { status })
}

/** Extract a clean hostname from a URL; returns "" on empty/invalid input (never throws). */
export function hostnameOf(url: string | null | undefined): string {
  if (!url) return ""
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}

/** Countdown badge for a saved-job deadline: muted "X days left" → amber ≤48h → red "Expired". */
export function deadlineBadge(deadline: string | null | undefined): { label: string; className: string } | null {
  if (!deadline) return null
  const days = differenceInDays(new Date(deadline), new Date())
  if (days < 0) return { label: "Expired", className: "text-[var(--status-rejected-fg)] bg-[var(--status-rejected-bg)]" }
  if (days <= 2) return { label: `${days}d left`, className: "text-[#f59e0b] bg-[#2d1f08]" }
  return { label: `${days} days left`, className: "text-text-muted bg-surface-elevated border border-border" }
}
