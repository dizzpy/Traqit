import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);
  const { id } = await params;

  const body = await req.json();
  const parsed = z.object({
    name: z.string().min(1).optional(),
    subject: z.string().min(1).optional(),
    body: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
  }).safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message, "VALIDATION_ERROR", 400);

  const result = await prisma.emailTemplate.updateMany({
    where: { id, profileId: profile.id },
    data: parsed.data,
  });
  if (result.count === 0) return apiError("Not found", "NOT_FOUND", 404);

  const template = await prisma.emailTemplate.findUnique({ where: { id } });
  return NextResponse.json({ data: template });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);
  const { id } = await params;

  await prisma.emailTemplate.deleteMany({ where: { id, profileId: profile.id } });
  return NextResponse.json({ data: { id } });
}
