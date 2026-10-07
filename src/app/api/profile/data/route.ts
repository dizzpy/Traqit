import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";
import { invalidateAppData } from "@/lib/redis";

/**
 * Wipe all tracked job data for the current account: soft-deletes every
 * application (same as any other delete — recoverable from Trash for 30
 * days, matching the bulk-delete pattern in `applications/bulk/route.ts`).
 * The account itself, custom sources/job types, pipeline and email templates
 * are kept.
 */
export async function DELETE() {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const { count } = await prisma.application.updateMany({
    where: { profileId: profile.id, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  await invalidateAppData(profile.id);
  return NextResponse.json({ data: { ok: true, deleted: count } });
}
