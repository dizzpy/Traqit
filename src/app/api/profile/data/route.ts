import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";

/**
 * Wipe all tracked job data for the current account: deletes every application
 * (which cascades to its stages, contacts, documents and activity). The account
 * itself, custom sources/job types, pipeline and email templates are kept.
 */
export async function DELETE() {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const { count } = await prisma.application.deleteMany({
    where: { profileId: profile.id },
  });

  return NextResponse.json({ data: { ok: true, deleted: count } });
}
