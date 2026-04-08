import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";

const createSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable(),
  stageName: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);
  const { id } = await params;
  const app = await prisma.application.findFirst({ where: { id, profileId: profile.id } });
  if (!app) return apiError("Not found", "NOT_FOUND", 404);
  const contacts = await prisma.contact.findMany({ where: { applicationId: id }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ data: contacts });
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

    const contact = await prisma.contact.create({ data: { ...parsed.data, applicationId: id } });
    await prisma.activity.create({
      data: { applicationId: id, type: "contact_added", description: `Contact added: ${parsed.data.name} (${parsed.data.role})` },
    });
    return NextResponse.json({ data: contact }, { status: 201 });
  } catch (err) {
    console.error(err);
    return apiError("Server error", "SERVER_ERROR", 500);
  }
}
