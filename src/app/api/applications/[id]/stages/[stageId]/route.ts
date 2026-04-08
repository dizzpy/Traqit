import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";

const updateSchema = z.object({
  name: z.string().optional(),
  status: z.enum(["UPCOMING", "COMPLETED", "PASSED", "FAILED", "SKIPPED"]).optional(),
  scheduledDate: z.string().optional().nullable(),
  completedDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);
  const { id, stageId } = await params;

  const app = await prisma.application.findFirst({ where: { id, profileId: profile.id } });
  if (!app) return apiError("Not found", "NOT_FOUND", 404);

  const stage = await prisma.pipelineStage.findFirst({ where: { id: stageId, applicationId: id } });
  if (!stage) return apiError("Stage not found", "NOT_FOUND", 404);

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.message, "VALIDATION_ERROR", 400);

    const { status, ...rest } = parsed.data;
    const updates: Record<string, unknown> = { ...rest };
    if (rest.scheduledDate !== undefined) updates.scheduledDate = rest.scheduledDate ? new Date(rest.scheduledDate) : null;
    if (rest.completedDate !== undefined) updates.completedDate = rest.completedDate ? new Date(rest.completedDate) : null;

    if (status) {
      updates.status = status;
      // Auto-update app status on stage change
      if (status === "FAILED") {
        await prisma.application.update({ where: { id }, data: { status: "REJECTED" } });
        await prisma.activity.create({
          data: { applicationId: id, type: "status_change", description: `Application marked as Rejected (stage "${stage.name}" failed)` },
        });
      }
    }

    const updated = await prisma.pipelineStage.update({ where: { id: stageId }, data: updates });

    await prisma.activity.create({
      data: {
        applicationId: id,
        type: "stage_updated",
        description: `Stage "${stage.name}" updated`,
        metadata: { stageId, ...(status ? { status } : {}) },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error(err);
    return apiError("Server error", "SERVER_ERROR", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);
  const { id, stageId } = await params;

  const app = await prisma.application.findFirst({ where: { id, profileId: profile.id } });
  if (!app) return apiError("Not found", "NOT_FOUND", 404);

  await prisma.pipelineStage.delete({ where: { id: stageId } });
  return NextResponse.json({ data: { ok: true } });
}
