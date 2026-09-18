import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";
import { invalidate, cacheKey } from "@/lib/redis";

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
    const { count } = await prisma.jobType.updateMany({
      where: { id, profileId: profile.id },
      data: { name: parsed.data.name },
    });
    if (count === 0) return apiError("Job type not found", "NOT_FOUND", 404);
    await invalidate(cacheKey.jobTypes(profile.id));
    return NextResponse.json({ data: { id, name: parsed.data.name } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return apiError(
        "A job type with this name already exists",
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

  await prisma.jobType.deleteMany({ where: { id, profileId: profile.id } });
  await invalidate(cacheKey.jobTypes(profile.id));
  return NextResponse.json({ data: { id } });
}
