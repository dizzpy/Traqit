import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";
import { cached, invalidate, cacheKey, TTL } from "@/lib/redis";

export async function GET() {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const types = await cached(cacheKey.jobTypes(profile.id), TTL.PRESETS, () =>
    prisma.jobType.findMany({
      where: { profileId: profile.id },
      orderBy: [{ usageCount: "desc" }, { name: "asc" }],
    })
  );
  return NextResponse.json(
    { data: types },
    { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=300" } }
  );
}

export async function POST(req: NextRequest) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const body = await req.json();
  const parsed = z.object({ name: z.string().min(1) }).safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message, "VALIDATION_ERROR", 400);

  const jobType = await prisma.jobType.upsert({
    where: { profileId_name: { profileId: profile.id, name: parsed.data.name } },
    update: {},
    create: { profileId: profile.id, name: parsed.data.name },
  });
  await invalidate(cacheKey.jobTypes(profile.id));
  return NextResponse.json({ data: jobType }, { status: 201 });
}
