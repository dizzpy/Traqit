import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";
import { purgeExpiredTrash } from "@/lib/trash";

/**
 * Trash contents for the current profile: soft-deleted applications + email
 * templates. Runs the lazy retention sweep first, so items past 30 days are
 * gone before they're ever shown (belt-and-braces with the pg_cron job).
 */
export async function GET() {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  await purgeExpiredTrash(profile.id);

  const [applications, emailTemplates] = await Promise.all([
    prisma.application.findMany({
      where: { profileId: profile.id, deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      select: {
        id: true,
        companyName: true,
        position: true,
        status: true,
        deletedAt: true,
      },
    }),
    prisma.emailTemplate.findMany({
      where: { profileId: profile.id, deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      select: { id: true, name: true, subject: true, category: true, deletedAt: true },
    }),
  ]);

  return NextResponse.json(
    {
      data: {
        applications,
        emailTemplates,
        counts: { applications: applications.length, emailTemplates: emailTemplates.length },
      },
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
