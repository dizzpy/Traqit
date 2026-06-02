import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";
import { invalidateAppData } from "@/lib/redis";

const include = {
  stages: { orderBy: { order: "asc" as const } },
  contacts: { orderBy: { createdAt: "asc" as const } },
  documents: { orderBy: { createdAt: "asc" as const } },
  activityLog: { orderBy: { createdAt: "desc" as const }, take: 50 },
};

const updateSchema = z.object({
  companyName: z.string().min(1).max(100).optional(),
  companyUrl: z.string().optional().nullable(),
  position: z.string().max(100).optional(),
  jobPostUrl: z.string().optional().nullable(),
  jobType: z.string().optional(),
  workMode: z.enum(["on-site", "remote", "hybrid", "no-data"]).optional(),
  appliedVia: z.string().optional(),
  salaryMin: z.number().optional().nullable(),
  salaryMax: z.number().optional().nullable(),
  currency: z.string().optional(),
  location: z.string().optional().nullable(),
  status: z.enum(["SAVED", "APPLIED", "IN_PROGRESS", "OFFER", "ACCEPTED", "REJECTED", "GHOSTED", "WITHDRAWN"]).optional(),
  appliedDate: z.string().optional().nullable(),
  firstResponseDate: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

async function getApp(id: string, profileId: string) {
  return prisma.application.findFirst({ where: { id, profileId } });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);
  const { id } = await params;
  const app = await prisma.application.findFirst({ where: { id, profileId: profile.id }, include });
  if (!app) return apiError("Not found", "NOT_FOUND", 404);
  return NextResponse.json({ data: app });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);
  const { id } = await params;
  const existing = await getApp(id, profile.id);
  if (!existing) return apiError("Not found", "NOT_FOUND", 404);

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.message, "VALIDATION_ERROR", 400);

    const { status, ...rest } = parsed.data;
    const updates: Record<string, unknown> = { ...rest };

    if (rest.appliedDate !== undefined) updates.appliedDate = rest.appliedDate ? new Date(rest.appliedDate) : null;
    if (rest.firstResponseDate !== undefined) updates.firstResponseDate = rest.firstResponseDate ? new Date(rest.firstResponseDate) : null;
    if (rest.deadline !== undefined) updates.deadline = rest.deadline ? new Date(rest.deadline) : null;

    // Log status change
    const activityCreate = [];
    if (status && status !== existing.status) {
      updates.status = status;
      activityCreate.push({
        type: "status_change",
        description: `Status changed from ${existing.status} to ${status}`,
        metadata: { from: existing.status, to: status },
      });
    }

    const app = await prisma.application.update({
      where: { id },
      data: {
        ...updates,
        activityLog: activityCreate.length > 0 ? { create: activityCreate } : undefined,
      },
      include,
    });

    await invalidateAppData(profile.id);
    return NextResponse.json({ data: app });
  } catch (err) {
    console.error(err);
    return apiError("Server error", "SERVER_ERROR", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);
  const { id } = await params;
  const existing = await getApp(id, profile.id);
  if (!existing) return apiError("Not found", "NOT_FOUND", 404);

  await prisma.application.delete({ where: { id } });
  await invalidateAppData(profile.id);
  return NextResponse.json({ data: { ok: true } });
}
