import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/utils";
import { isAuthorizedCron } from "@/lib/cron";
import { isMailerConfigured } from "@/lib/mailer";
import { runReminderCheck } from "@/lib/notifications";

/** Called by the pg_cron job in prisma/sql/pg_cron_notifications.sql. */
export async function POST(req: NextRequest) {
  if (!isAuthorizedCron(req))
    return apiError("Unauthorized", "UNAUTHORIZED", 401);
  // Without SMTP every send would fail and be retried next run anyway — fail
  // loudly instead so a misconfigured deploy shows up in cron run history.
  if (!isMailerConfigured())
    return apiError("Email is not configured", "EMAIL_NOT_CONFIGURED", 503);

  try {
    const result = await runReminderCheck();
    return NextResponse.json({ data: result });
  } catch (err) {
    console.error(err);
    return apiError("Server error", "SERVER_ERROR", 500);
  }
}
