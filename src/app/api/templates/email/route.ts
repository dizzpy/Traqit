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
    cacheKey.emailTemplates(profile.id),
    TTL.TEMPLATES,
    () =>
      prisma.emailTemplate.findMany({
        where: { profileId: profile.id, deletedAt: null },
        orderBy: [{ order: "asc" }, { name: "asc" }],
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
      subject: z.string().min(1),
      body: z.string().min(1),
      category: z.string().min(1).default("General"),
    })
    .safeParse(body);
  if (!parsed.success)
    return apiError(parsed.error.message, "VALIDATION_ERROR", 400);

  // New templates go to the bottom of the list.
  const last = await prisma.emailTemplate.findFirst({
    where: { profileId: profile.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const nextOrder = (last?.order ?? -1) + 1;

  // Names are unique per profile, trashed templates included. Reject rather
  // than overwrite, so saving can never silently replace an existing
  // template's content.
  const clash = await prisma.emailTemplate.findUnique({
    where: {
      profileId_name: { profileId: profile.id, name: parsed.data.name },
    },
    select: { deletedAt: true },
  });
  if (clash) {
    return clash.deletedAt
      ? apiError(
          "A template with this name is in Trash. Restore it or pick another name.",
          "NAME_IN_TRASH",
          409,
        )
      : apiError(
          "A template with this name already exists",
          "DUPLICATE_NAME",
          409,
        );
  }

  try {
    const template = await prisma.emailTemplate.create({
      data: { profileId: profile.id, ...parsed.data, order: nextOrder },
    });
    await invalidate(cacheKey.emailTemplates(profile.id));
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
