import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInCalendarDays, format, formatDistanceToNow } from "date-fns"
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
