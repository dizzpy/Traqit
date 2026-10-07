import { prisma } from "@/lib/prisma";
import { sendMail, type MailMessage } from "@/lib/mailer";
import { APP_URL, SITE_URL } from "@/lib/urls";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
// Longest reminderLeadTime option offered in Settings.
const MAX_LEAD_HOURS = 48;

export interface CheckResult {
  sent: number;
  failed: number;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function appLink(): string {
  return `${APP_URL || SITE_URL}/app/applications`;
}

/** Shared shell so both emails read as the same calm product. */
function layout(heading: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f7f5fb;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1f1b2e">
<div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e7e2f3;border-radius:12px;padding:24px">
<h1 style="margin:0 0 12px;font-size:18px;font-weight:600">${escapeHtml(heading)}</h1>
${bodyHtml}
<p style="margin:20px 0 0"><a href="${escapeHtml(appLink())}" style="display:inline-block;background:#7c5cff;color:#ffffff;text-decoration:none;padding:8px 14px;border-radius:8px;font-size:14px">Open Traqit</a></p>
<p style="margin:20px 0 0;font-size:12px;color:#8a84a0">You're getting this because email reminders are on. Turn them off any time in Traqit → Settings.</p>
</div></body></html>`;
}

/** Stage dates are date-only (stored at 00:00 UTC), so format them in UTC. */
function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

type GhostApp = {
  id: string;
  companyName: string;
  position: string;
  appliedDate: Date;
};

export function ghostEmail(
  name: string,
  apps: GhostApp[],
  now: Date,
): Omit<MailMessage, "to"> {
  const days = (a: GhostApp) =>
    Math.floor((now.getTime() - a.appliedDate.getTime()) / DAY_MS);
  const subject =
    apps.length === 1
      ? `No reply from ${apps[0].companyName} in ${days(apps[0])} days`
      : `${apps.length} applications have gone quiet`;
  const lines = apps.map(
    (a) =>
      `${a.position} at ${a.companyName} — ${days(a)} days since you applied`,
  );
  const intro = `Hi ${name}, ${apps.length === 1 ? "this application hasn't" : "these applications haven't"} had a reply in a while. It might be worth a follow-up, or marking ${apps.length === 1 ? "it" : "them"} as ghosted.`;
  return {
    subject,
    text: `${intro}\n\n${lines.map((l) => `• ${l}`).join("\n")}\n\n${appLink()}`,
    html: layout(
      subject,
      `<p style="margin:0 0 12px;font-size:14px;line-height:1.5">${escapeHtml(intro)}</p>
<ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.7">${lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>`,
    ),
  };
}

export function reminderEmail(
  name: string,
  stage: { name: string; scheduledDate: Date },
  app: { companyName: string; position: string },
): Omit<MailMessage, "to"> {
  const subject = `Coming up: ${stage.name} with ${app.companyName}`;
  const line = `${stage.name} for ${app.position} at ${app.companyName} is scheduled for ${formatDate(stage.scheduledDate)}.`;
  return {
    subject,
    text: `Hi ${name}, a heads-up: ${line} Good luck!\n\n${appLink()}`,
    html: layout(
      subject,
      `<p style="margin:0;font-size:14px;line-height:1.5">Hi ${escapeHtml(name)}, a heads-up: ${escapeHtml(line)} Good luck!</p>`,
    ),
  };
}

/**
 * 8.2 — emails each opted-in user about applications that have been APPLIED
 * with no response for longer than their ghost threshold (same rule as the
 * "Nd silent" badge in the table). One digest email per user per run.
 *
 * Dedupe: rows are claimed (ghostNotifiedAt set) before sending, guarded on
 * ghostNotifiedAt still being null so an overlapping run can't double-send;
 * a failed send releases the claim so the next run retries.
 */
export async function runGhostCheck(now = new Date()): Promise<CheckResult> {
  const candidates = await prisma.application.findMany({
    where: {
      deletedAt: null,
      status: "APPLIED",
      firstResponseDate: null,
      ghostNotifiedAt: null,
      appliedDate: { not: null, lte: new Date(now.getTime() - DAY_MS) },
      profile: { remindersEnabled: true },
    },
    select: {
      id: true,
      companyName: true,
      position: true,
      appliedDate: true,
      profile: {
        select: { id: true, email: true, name: true, ghostThresholdDays: true },
      },
    },
    orderBy: { appliedDate: "asc" },
  });

  const byProfile = new Map<
    string,
    { profile: (typeof candidates)[number]["profile"]; apps: GhostApp[] }
  >();
  for (const a of candidates) {
    const cutoff = now.getTime() - a.profile.ghostThresholdDays * DAY_MS;
    if (a.appliedDate!.getTime() > cutoff) continue;
    const entry = byProfile.get(a.profile.id) ?? {
      profile: a.profile,
      apps: [],
    };
    entry.apps.push({ ...a, appliedDate: a.appliedDate! });
    byProfile.set(a.profile.id, entry);
  }

  const result: CheckResult = { sent: 0, failed: 0 };
  for (const { profile, apps } of byProfile.values()) {
    const ids = apps.map((a) => a.id);
    const claimed = await prisma.application.updateMany({
      where: { id: { in: ids }, ghostNotifiedAt: null },
      data: { ghostNotifiedAt: now },
    });
    // Another run got here first — skip rather than risk a duplicate.
    if (claimed.count !== ids.length) {
      if (claimed.count > 0) {
        await prisma.application.updateMany({
          where: { id: { in: ids }, ghostNotifiedAt: now },
          data: { ghostNotifiedAt: null },
        });
      }
      continue;
    }
    try {
      await sendMail({
        to: profile.email,
        ...ghostEmail(profile.name, apps, now),
      });
      result.sent++;
    } catch (err) {
      console.error("ghost-check: send failed", profile.id, err);
      await prisma.application.updateMany({
        where: { id: { in: ids }, ghostNotifiedAt: now },
        data: { ghostNotifiedAt: null },
      });
      result.failed++;
    }
  }
  return result;
}

/**
 * 12.5 — emails a reminder for each UPCOMING stage whose scheduled date is
 * within the owner's reminderLeadTime. Same claim-then-send dedupe as above,
 * on PipelineStage.reminderSentAt (cleared when the stage is rescheduled).
 */
export async function runReminderCheck(now = new Date()): Promise<CheckResult> {
  const stages = await prisma.pipelineStage.findMany({
    where: {
      status: "UPCOMING",
      reminderSentAt: null,
      scheduledDate: {
        gt: now,
        lte: new Date(now.getTime() + MAX_LEAD_HOURS * HOUR_MS),
      },
      application: {
        deletedAt: null,
        status: { notIn: ["REJECTED", "WITHDRAWN"] },
        profile: { remindersEnabled: true },
      },
    },
    select: {
      id: true,
      name: true,
      scheduledDate: true,
      application: {
        select: {
          companyName: true,
          position: true,
          profile: {
            select: {
              id: true,
              email: true,
              name: true,
              reminderLeadTime: true,
            },
          },
        },
      },
    },
  });

  const result: CheckResult = { sent: 0, failed: 0 };
  for (const stage of stages) {
    const { profile } = stage.application;
    const scheduled = stage.scheduledDate!;
    if (
      scheduled.getTime() - now.getTime() >
      profile.reminderLeadTime * HOUR_MS
    )
      continue;

    const claimed = await prisma.pipelineStage.updateMany({
      where: { id: stage.id, reminderSentAt: null },
      data: { reminderSentAt: now },
    });
    if (claimed.count === 0) continue;
    try {
      await sendMail({
        to: profile.email,
        ...reminderEmail(
          profile.name,
          { name: stage.name, scheduledDate: scheduled },
          stage.application,
        ),
      });
      result.sent++;
    } catch (err) {
      console.error("reminder-check: send failed", stage.id, err);
      await prisma.pipelineStage.updateMany({
        where: { id: stage.id, reminderSentAt: now },
        data: { reminderSentAt: null },
      });
      result.failed++;
    }
  }
  return result;
}
