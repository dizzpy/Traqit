import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";
import { invalidate, cacheKey } from "@/lib/redis";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);
  const { id } = await params;

  const body = await req.json();
  const parsed = z
    .object({
      name: z.string().min(1).optional(),
      subject: z.string().min(1).optional(),
      body: z.string().min(1).optional(),
      category: z.string().min(1).optional(),
    })
    .safeParse(body);
  if (!parsed.success)
    return apiError(parsed.error.message, "VALIDATION_ERROR", 400);

  let result: Prisma.BatchPayload;
  try {
    result = await prisma.emailTemplate.updateMany({
      where: { id, profileId: profile.id, deletedAt: null },
      data: parsed.data,
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return apiError(
        "A template with this name already exists",
        "DUPLICATE_NAME",
        409,
      );
    }
    throw err;
  }
  if (result.count === 0) return apiError("Not found", "NOT_FOUND", 404);

  const template = await prisma.emailTemplate.findUnique({ where: { id } });
  await invalidate(cacheKey.emailTemplates(profile.id));
  return NextResponse.json({ data: template });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);
  const { id } = await params;

  // Soft delete → Trash (recoverable for 30 days). Restore via /api/trash/restore.
  const result = await prisma.emailTemplate.updateMany({
    where: { id, profileId: profile.id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (result.count === 0) return apiError("Not found", "NOT_FOUND", 404);
  await invalidate(cacheKey.emailTemplates(profile.id));
  return NextResponse.json({ data: { id } });
}
