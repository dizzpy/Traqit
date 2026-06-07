import { prisma } from "./prisma";

/** How long a trashed item is kept before it's permanently removed. */
export const TRASH_RETENTION_DAYS = 30;

/** Epoch ms cutoff: anything trashed before this is past retention. */
export function trashCutoff(now = Date.now()): Date {
  return new Date(now - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

/** Whole days left before a trashed item (deletedAt) is auto-purged. */
export function daysLeft(deletedAt: string | Date, now = Date.now()): number {
  const purgeAt = new Date(deletedAt).getTime() + TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((purgeAt - now) / (24 * 60 * 60 * 1000)));
}

/**
 * Hard-delete a profile's trashed rows that are past the retention window.
 * Lazy fallback for the daily pg_cron purge — cheap enough to run on every
 * Trash read, so retention holds even if the cron job isn't configured.
 */
export async function purgeExpiredTrash(profileId: string): Promise<void> {
  const cutoff = trashCutoff();
  await Promise.all([
    prisma.application.deleteMany({ where: { profileId, deletedAt: { not: null, lt: cutoff } } }),
    prisma.emailTemplate.deleteMany({ where: { profileId, deletedAt: { not: null, lt: cutoff } } }),
  ]);
}
