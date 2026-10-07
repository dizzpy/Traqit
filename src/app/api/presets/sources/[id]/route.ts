import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";
import { invalidate, invalidateAppData, cacheKey } from "@/lib/redis";

const patchSchema = z.object({ name: z.string().min(1) });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);
  const { id } = await params;

  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success)
    return apiError(parsed.error.message, "VALIDATION_ERROR", 400);

  try {
    const existing = await prisma.source.findFirst({
      where: { id, profileId: profile.id },
      select: { name: true },
    });
    if (!existing) return apiError("Source not found", "NOT_FOUND", 404);
    // Applications store the name as text, so carry the rename over to them
    // (trashed ones included) — otherwise they'd keep the old spelling and
    // analytics would split one source into two.
    await prisma.$transaction([
      prisma.source.update({
        where: { id },
        data: { name: parsed.data.name },
      }),
      prisma.application.updateMany({
        where: { profileId: profile.id, appliedVia: existing.name },
        data: { appliedVia: parsed.data.name },
      }),
    ]);
    await invalidateAppData(profile.id);
    await invalidate(cacheKey.sources(profile.id));
    return NextResponse.json({ data: { id, name: parsed.data.name } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return apiError(
        "A source with this name already exists",
        "DUPLICATE_NAME",
        409,
      );
    }
    throw err;
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);
  const { id } = await params;

  await prisma.source.deleteMany({ where: { id, profileId: profile.id } });
  await invalidate(cacheKey.sources(profile.id));
  return NextResponse.json({ data: { id } });
}
