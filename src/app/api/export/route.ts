import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";

/**
 * Full data export for the current profile: every application with its stages,
 * contacts, documents and activity. Returned as a downloadable JSON attachment.
 * Scoped to the session's profile — never another user's data.
 */
export async function GET() {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const applications = await prisma.application.findMany({
    where: { profileId: profile.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      stages: { orderBy: { order: "asc" } },
      contacts: { orderBy: { createdAt: "asc" } },
      documents: { orderBy: { createdAt: "asc" } },
      activityLog: { orderBy: { createdAt: "desc" } },
    },
  });

  const payload = {
    exportedAt: new Date().toISOString(),
    profile: { name: profile.name, email: profile.email },
    applications,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="traqit-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
