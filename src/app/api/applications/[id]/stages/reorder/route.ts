import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";
import { invalidateAppData } from "@/lib/redis";

const reorderSchema = z.object({
  orderedIds: z.array(z.string()).min(1),
});

/**
 * Persist a new pipeline-stage order. Body: { orderedIds: string[] } — the full
 * list of this application's stage ids, top → bottom. Orders become 1-based to
 * match the create endpoint. Done in a transaction with a two-pass write
 * (temp-negative orders, then final) so the @@unique([applicationId, order])
 * constraint never collides mid-update.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);
  const { id } = await params;

  const app = await prisma.application.findFirst({ where: { id, profileId: profile.id } });
  if (!app) return apiError("Not found", "NOT_FOUND", 404);

  try {
    const body = await req.json();
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.message, "VALIDATION_ERROR", 400);
    const { orderedIds } = parsed.data;

    const existing = await prisma.pipelineStage.findMany({
      where: { applicationId: id },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((s) => s.id));
    if (orderedIds.length !== existingIds.size || !orderedIds.every((sid) => existingIds.has(sid))) {
      return apiError("orderedIds must contain exactly this application's stages", "VALIDATION_ERROR", 400);
    }

    await prisma.$transaction([
      // Pass 1: park everything at unique negative orders to clear the way.
      ...orderedIds.map((sid, i) =>
        prisma.pipelineStage.update({ where: { id: sid }, data: { order: -(i + 1) } })
      ),
      // Pass 2: assign the final 1-based orders.
      ...orderedIds.map((sid, i) =>
        prisma.pipelineStage.update({ where: { id: sid }, data: { order: i + 1 } })
      ),
    ]);

    const stages = await prisma.pipelineStage.findMany({
      where: { applicationId: id },
      orderBy: { order: "asc" },
    });
    await invalidateAppData(profile.id);
    return NextResponse.json({ data: stages });
  } catch (err) {
    console.error(err);
    return apiError("Server error", "SERVER_ERROR", 500);
  }
}
