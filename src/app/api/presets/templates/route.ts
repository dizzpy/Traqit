import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";
import { cached, invalidate, cacheKey, TTL } from "@/lib/redis";

export async function GET() {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const templates = await cached(
    cacheKey.pipTemplates(profile.id),
    TTL.PRESETS,
    () =>
      prisma.pipelineTemplate.findMany({
        where: { profileId: profile.id },
        orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      }),
  );
  return NextResponse.json(
    { data: templates },
    {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
      },
    },
  );
}

export async function POST(req: NextRequest) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const body = await req.json();
  const parsed = z
    .object({
      name: z.string().min(1),
      stages: z.array(z.string().min(1)).min(1),
      isDefault: z.boolean().default(false),
    })
    .safeParse(body);
  if (!parsed.success)
    return apiError(parsed.error.message, "VALIDATION_ERROR", 400);

  try {
    const template = await prisma.pipelineTemplate.create({
      data: { profileId: profile.id, ...parsed.data },
    });
    // Only one template may be the default — same rule as PATCH.
    if (template.isDefault) {
      await prisma.pipelineTemplate.updateMany({
        where: {
          profileId: profile.id,
          isDefault: true,
          NOT: { id: template.id },
        },
        data: { isDefault: false },
      });
    }
    await invalidate(cacheKey.pipTemplates(profile.id));
    return NextResponse.json({ data: template }, { status: 201 });
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
}
