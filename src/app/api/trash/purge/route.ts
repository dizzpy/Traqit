import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";
import { invalidateAppData, invalidate, cacheKey } from "@/lib/redis";

const schema = z.object({
  type: z.enum(["application", "emailTemplate"]),
  // omit `ids` to empty the whole trash for that type.
  ids: z.array(z.string()).min(1).max(1000).optional(),
});

/**
 * Permanently delete items from Trash ("Delete forever" / "Empty trash").
 * Guarded by `deletedAt: { not: null }` so a live record can never be hard
 * deleted through this route.
 */
export async function POST(req: NextRequest) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return apiError(parsed.error.message, "VALIDATION_ERROR", 400);
  const { type, ids } = parsed.data;

  const where = {
    profileId: profile.id,
    deletedAt: { not: null },
    ...(ids ? { id: { in: ids } } : {}),
  };

  if (type === "application") {
    const { count } = await prisma.application.deleteMany({ where });
    await invalidateAppData(profile.id);
    return NextResponse.json({ data: { count } });
  }

  const { count } = await prisma.emailTemplate.deleteMany({ where });
  await invalidate(cacheKey.emailTemplates(profile.id));
  return NextResponse.json({ data: { count } });
}
