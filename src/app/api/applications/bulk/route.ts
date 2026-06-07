import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";
import { invalidateAppData } from "@/lib/redis";

const schema = z.object({
  ids: z.array(z.string()).min(1).max(1000),
});

/**
 * Bulk-trash applications in a single request + single DB write. Replaces the
 * old client-side `Promise.all(ids.map(DELETE))`, which fired N requests, tripped
 * the write rate-limiter, and failed partially ("Couldn't delete some
 * applications"). Soft delete → recoverable from Trash.
 */
export async function POST(req: NextRequest) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return apiError(parsed.error.message, "VALIDATION_ERROR", 400);

  const { count } = await prisma.application.updateMany({
    where: { id: { in: parsed.data.ids }, profileId: profile.id, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  await invalidateAppData(profile.id);
  return NextResponse.json({ data: { count } });
}
