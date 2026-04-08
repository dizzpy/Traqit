import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";
import { computeAnalytics } from "@/lib/analytics";
import type { Application } from "@/types";

export async function GET() {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const applications = await prisma.application.findMany({
    where: { profileId: profile.id },
    include: {
      stages: { orderBy: { order: "asc" } },
      contacts: true,
      documents: true,
      activityLog: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  const analytics = computeAnalytics(applications as unknown as Application[]);
  return NextResponse.json({ data: analytics });
}
