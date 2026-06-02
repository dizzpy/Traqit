import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";
import { invalidate, cacheKey } from "@/lib/redis";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);
  const { id } = await params;

  const body = await req.json();
  const parsed = z.object({
    name: z.string().min(1).optional(),
    stages: z.array(z.string().min(1)).min(1).optional(),
    isDefault: z.boolean().optional(),
  }).safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message, "VALIDATION_ERROR", 400);

  const existing = await prisma.pipelineTemplate.findFirst({ where: { id, profileId: profile.id } });
  if (!existing) return apiError("Not found", "NOT_FOUND", 404);

  // Only one template may be the default — clear the others first.
  if (parsed.data.isDefault) {
    await prisma.pipelineTemplate.updateMany({
      where: { profileId: profile.id, isDefault: true, NOT: { id } },
      data: { isDefault: false },
    });
  }

  const template = await prisma.pipelineTemplate.update({
    where: { id },
    data: parsed.data,
  });
  await invalidate(cacheKey.pipTemplates(profile.id));
  return NextResponse.json({ data: template });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);
  const { id } = await params;

  await prisma.pipelineTemplate.deleteMany({ where: { id, profileId: profile.id } });
  // If a profile's default-template preference pointed here, clear it.
  await prisma.profile.updateMany({
    where: { id: profile.id, defaultPipelineTemplateId: id },
    data: { defaultPipelineTemplateId: null },
  });
  // Templates list changed, and the profile's default pointer may have been cleared.
  await invalidate(cacheKey.pipTemplates(profile.id), cacheKey.profile(profile.userId));
  return NextResponse.json({ data: { id } });
}
