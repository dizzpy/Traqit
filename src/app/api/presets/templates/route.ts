import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";

export async function GET() {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const templates = await prisma.pipelineTemplate.findMany({
    where: { profileId: profile.id },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
  return NextResponse.json({ data: templates });
}

export async function POST(req: NextRequest) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const body = await req.json();
  const parsed = z.object({
    name: z.string().min(1),
    stages: z.array(z.string().min(1)).min(1),
    isDefault: z.boolean().default(false),
  }).safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message, "VALIDATION_ERROR", 400);

  const template = await prisma.pipelineTemplate.upsert({
    where: { profileId_name: { profileId: profile.id, name: parsed.data.name } },
    update: { stages: parsed.data.stages },
    create: { profileId: profile.id, ...parsed.data },
  });
  return NextResponse.json({ data: template }, { status: 201 });
}
