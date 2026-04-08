import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);
  const { id } = await params;

  const app = await prisma.application.findFirst({ where: { id, profileId: profile.id } });
  if (!app) return apiError("Not found", "NOT_FOUND", 404);

  const activity = await prisma.activity.findMany({
    where: { applicationId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data: activity });
}
