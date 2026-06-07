import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";
import { invalidateAppData } from "@/lib/redis";

const createSchema = z.object({
  name: z.string().min(1),
  order: z.number().int().min(1),
  status: z.enum(["UPCOMING", "COMPLETED", "PASSED", "FAILED", "SKIPPED"]).default("UPCOMING"),
  scheduledDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);
  const { id } = await params;

  const app = await prisma.application.findFirst({ where: { id, profileId: profile.id } });
  if (!app) return apiError("Not found", "NOT_FOUND", 404);

  const stages = await prisma.pipelineStage.findMany({
    where: { applicationId: id },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ data: stages });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);
  const { id } = await params;

  const app = await prisma.application.findFirst({ where: { id, profileId: profile.id } });
  if (!app) return apiError("Not found", "NOT_FOUND", 404);

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.message, "VALIDATION_ERROR", 400);

    // Shift existing stages to make room, then insert — atomically, so a failure
    // can't leave a gap or a half-applied shift. The unique(applicationId, order)
    // constraint was removed (it tripped Postgres's per-row check during the
    // increment), so this no longer 500s on inserts between stages.
    const { order, ...data } = parsed.data;
    const stage = await prisma.$transaction(async (tx) => {
      await tx.pipelineStage.updateMany({
        where: { applicationId: id, order: { gte: order } },
        data: { order: { increment: 1 } },
      });
      const created = await tx.pipelineStage.create({
        data: {
          ...data,
          applicationId: id,
          order,
          scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
        },
      });
      await tx.activity.create({
        data: {
          applicationId: id,
          type: "stage_added",
          description: `Pipeline stage "${data.name}" added`,
        },
      });
      return created;
    });

    await invalidateAppData(profile.id);
    return NextResponse.json({ data: stage }, { status: 201 });
  } catch (err) {
    console.error(err);
    return apiError("Server error", "SERVER_ERROR", 500);
  }
}
