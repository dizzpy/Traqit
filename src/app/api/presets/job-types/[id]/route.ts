import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";
import { invalidate, cacheKey } from "@/lib/redis";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);
  const { id } = await params;

  await prisma.jobType.deleteMany({ where: { id, profileId: profile.id } });
  await invalidate(cacheKey.jobTypes(profile.id));
  return NextResponse.json({ data: { id } });
}
