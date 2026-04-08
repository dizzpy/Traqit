import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";

const createSchema = z.object({
  companyName: z.string().min(1).max(100),
  companyUrl: z.string().url().optional().nullable(),
  position: z.string().min(1).max(100),
  jobPostUrl: z.string().url().optional().nullable(),
  jobType: z.string().min(1),
  workMode: z.enum(["on-site", "remote", "hybrid", "no-data"]),
  appliedVia: z.string().min(1),
  salaryMin: z.number().optional().nullable(),
  salaryMax: z.number().optional().nullable(),
  currency: z.string().default("LKR"),
  location: z.string().optional().nullable(),
  status: z.enum(["SAVED", "APPLIED", "IN_PROGRESS", "OFFER", "ACCEPTED", "REJECTED", "GHOSTED", "WITHDRAWN"]).default("APPLIED"),
  appliedDate: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  templateId: z.string().optional().nullable(),
});

const include = {
  stages: { orderBy: { order: "asc" as const } },
  contacts: { orderBy: { createdAt: "asc" as const } },
  documents: { orderBy: { createdAt: "asc" as const } },
  activityLog: { orderBy: { createdAt: "desc" as const }, take: 20 },
};

export async function GET(req: NextRequest) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const source = searchParams.get("source");
  const workMode = searchParams.get("workMode");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const sort = searchParams.get("sort") ?? "createdAt";
  const order = (searchParams.get("order") ?? "desc") as "asc" | "desc";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "25");

  const where: Record<string, unknown> = { profileId: profile.id };

  if (status) {
    const statuses = status.split(",");
    where.status = { in: statuses };
  }
  if (source) where.appliedVia = source;
  if (workMode) where.workMode = workMode;
  if (from || to) {
    where.appliedDate = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const [apps, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.application.count({ where }),
  ]);

  return NextResponse.json({ data: apps, total, page, limit });
}

export async function POST(req: NextRequest) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.message, "VALIDATION_ERROR", 400);
    }

    const { templateId, ...data } = parsed.data;

    const app = await prisma.application.create({
      data: {
        ...data,
        profileId: profile.id,
        appliedDate: data.appliedDate ? new Date(data.appliedDate) : null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        activityLog: {
          create: {
            type: "created",
            description: "Application created",
          },
        },
      },
      include,
    });

    // Create stages from template if provided
    if (templateId) {
      const template = await prisma.pipelineTemplate.findFirst({
        where: { id: templateId, profileId: profile.id },
      });
      if (template) {
        const stages = template.stages as string[];
        await prisma.pipelineStage.createMany({
          data: stages.map((name, i) => ({
            applicationId: app.id,
            name,
            order: i + 1,
          })),
        });
        // Bump source usage
        await prisma.source.updateMany({
          where: { profileId: profile.id, name: data.appliedVia },
          data: { usageCount: { increment: 1 } },
        });
      }
    }

    const final = await prisma.application.findUnique({
      where: { id: app.id },
      include,
    });

    return NextResponse.json({ data: final }, { status: 201 });
  } catch (err) {
    console.error(err);
    return apiError("Server error", "SERVER_ERROR", 500);
  }
}
