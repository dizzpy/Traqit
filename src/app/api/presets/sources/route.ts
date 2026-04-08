import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";

export async function GET() {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const sources = await prisma.source.findMany({
    where: { profileId: profile.id },
    orderBy: [{ usageCount: "desc" }, { name: "asc" }],
  });
  return NextResponse.json({ data: sources });
}

export async function POST(req: NextRequest) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const body = await req.json();
  const parsed = z.object({ name: z.string().min(1) }).safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message, "VALIDATION_ERROR", 400);

  const source = await prisma.source.upsert({
    where: { profileId_name: { profileId: profile.id, name: parsed.data.name } },
    update: {},
    create: { profileId: profile.id, name: parsed.data.name },
  });
  return NextResponse.json({ data: source }, { status: 201 });
}
