import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";
import { invalidate, cacheKey } from "@/lib/redis";

const reorderSchema = z.object({
  orderedIds: z.array(z.string()).min(1),
});

/**
 * Persist a new email-template order. Body: { orderedIds: string[] } — the full
 * list of this profile's template ids, top → bottom. `order` is not unique, so a
 * single-pass transaction assigning 0-based indices is enough.
 */
export async function PATCH(req: NextRequest) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  try {
    const body = await req.json();
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.message, "VALIDATION_ERROR", 400);
    const { orderedIds } = parsed.data;

    const existing = await prisma.emailTemplate.findMany({
      where: { profileId: profile.id },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((t) => t.id));
    if (orderedIds.length !== existingIds.size || !orderedIds.every((id) => existingIds.has(id))) {
      return apiError("orderedIds must contain exactly this profile's templates", "VALIDATION_ERROR", 400);
    }

    await prisma.$transaction(
      orderedIds.map((id, i) =>
        prisma.emailTemplate.update({ where: { id }, data: { order: i } })
      )
    );

    const templates = await prisma.emailTemplate.findMany({
      where: { profileId: profile.id },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });
    await invalidate(cacheKey.emailTemplates(profile.id));
    return NextResponse.json({ data: templates });
  } catch (err) {
    console.error(err);
    return apiError("Server error", "SERVER_ERROR", 500);
  }
}
