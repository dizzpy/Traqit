"use client";

import { useEffect } from "react";
import { updateProfile } from "@/hooks/use-profile";

/**
 * Saves the browser's timezone on the profile so server-sent emails can show
 * stage times in it. Only PATCHes when it differs from what's saved; failure
 * is silent (emails fall back to UTC).
 */
export function TimezoneSync({ saved }: { saved: string | null }) {
  useEffect(() => {
    let tz: string | undefined;
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return;
    }
    if (!tz || tz === saved) return;
    updateProfile({ timezone: tz }).catch(() => {});
  }, [saved]);
  return null;
}
