import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const type = searchParams.get("type");
  const appId = searchParams.get("applicationId");

  const where: Record<string, unknown> = {
    application: { profileId: profile.id, deletedAt: null },
  };
  if (type) where.type = type;
  if (appId) where.applicationId = appId;

  const [items, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      include: { application: { select: { companyName: true, position: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.activity.count({ where }),
  ]);

  return NextResponse.json({ data: items, total, page, limit });
}
