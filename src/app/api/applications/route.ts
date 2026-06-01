import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";
import { cached, cacheKey, invalidate, invalidateAppData, TTL } from "@/lib/redis";

const createSchema = z.object({
  companyName: z.string().min(1).max(100),
  companyUrl: z.string().optional().nullable(),
  // position/jobType/appliedVia can be filled in later (Notion-style quick add).
  position: z.string().max(100).optional().default(""),
  jobPostUrl: z.string().optional().nullable(),
  jobType: z.string().optional().default(""),
  workMode: z.enum(["on-site", "remote", "hybrid", "no-data"]).default("no-data"),
  appliedVia: z.string().optional().default(""),
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

// List view renders summary fields + the pipeline stages only. Contacts,
// documents and activity are fetched on demand by the detail panel
// (GET /api/applications/[id]), so we omit those heavy relations here.
const listSelect = {
  id: true,
  profileId: true,
  companyName: true,
  companyUrl: true,
  position: true,
  jobPostUrl: true,
  jobType: true,
  workMode: true,
  appliedVia: true,
  salaryMin: true,
  salaryMax: true,
  currency: true,
  location: true,
  status: true,
  appliedDate: true,
  firstResponseDate: true,
  deadline: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  stages: { orderBy: { order: "asc" as const } },
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
  // ?full=1 returns the complete nested object (contacts/documents/activity) —
  // used by the data export. The default list view stays trimmed for speed.
  const full = searchParams.get("full") === "1";

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

  const findArgs = {
    where,
    orderBy: { [sort]: order },
    skip: (page - 1) * limit,
    take: limit,
  };

  const queryDb = async () => {
    const [apps, total] = await Promise.all([
      full
        ? prisma.application.findMany({ ...findArgs, include })
        : prisma.application.findMany({ ...findArgs, select: listSelect }),
      prisma.application.count({ where }),
    ]);
    return { data: apps, total };
  };

  // The full export is rare and large — never cache it. The trimmed list is
  // cached per normalized query string (filters + sort + page) under APPS_LIST.
  const result = full
    ? await queryDb()
    : await cached(
        cacheKey.apps(
          profile.id,
          new URLSearchParams({
            status: status ?? "",
            source: source ?? "",
            workMode: workMode ?? "",
            from: from ?? "",
            to: to ?? "",
            sort,
            order,
            page: String(page),
            limit: String(limit),
          }).toString()
        ),
        TTL.APPS_LIST,
        queryDb
      );

  return NextResponse.json(
    { ...result, page, limit },
    { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" } }
  );
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

    // Resolve template stages up front so the application + its stages + the
    // activity entry can all be created in a single round trip via nested writes.
    let stageNames: string[] = [];
    if (templateId) {
      const template = await prisma.pipelineTemplate.findFirst({
        where: { id: templateId, profileId: profile.id },
      });
      if (template) stageNames = template.stages as string[];
    }

    // Create the application (with stages + activity nested) and bump the source
    // usage in parallel — the source update doesn't depend on the new app.
    const [app] = await Promise.all([
      prisma.application.create({
        data: {
          ...data,
          profileId: profile.id,
          appliedDate: data.appliedDate ? new Date(data.appliedDate) : null,
          deadline: data.deadline ? new Date(data.deadline) : null,
          activityLog: {
            create: { type: "created", description: "Application created" },
          },
          ...(stageNames.length > 0
            ? { stages: { create: stageNames.map((name, i) => ({ name, order: i + 1 })) } }
            : {}),
        },
        include,
      }),
      stageNames.length > 0
        ? prisma.source.updateMany({
            where: { profileId: profile.id, name: data.appliedVia },
            data: { usageCount: { increment: 1 } },
          })
        : Promise.resolve(),
    ]);

    await invalidateAppData(profile.id);
    // A used template bumps the source's usageCount, changing the sources order.
    if (stageNames.length > 0) await invalidate(cacheKey.sources(profile.id));
    return NextResponse.json({ data: app }, { status: 201 });
  } catch (err) {
    console.error(err);
    return apiError("Server error", "SERVER_ERROR", 500);
  }
}
