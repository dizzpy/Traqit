import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";

const createSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  type: z.enum(["cv", "cover-letter", "portfolio", "other"]),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);
  const { id } = await params;
  const app = await prisma.application.findFirst({ where: { id, profileId: profile.id } });
  if (!app) return apiError("Not found", "NOT_FOUND", 404);
  const docs = await prisma.document.findMany({ where: { applicationId: id }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ data: docs });
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

    const doc = await prisma.document.create({ data: { ...parsed.data, applicationId: id } });
    await prisma.activity.create({
      data: { applicationId: id, type: "document_added", description: `Document added: ${parsed.data.name}` },
    });
    return NextResponse.json({ data: doc }, { status: 201 });
  } catch (err) {
    console.error(err);
    return apiError("Server error", "SERVER_ERROR", 500);
  }
}
