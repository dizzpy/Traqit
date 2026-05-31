import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";

export async function GET() {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const templates = await prisma.emailTemplate.findMany({
    where: { profileId: profile.id },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ data: templates });
}

export async function POST(req: NextRequest) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const body = await req.json();
  const parsed = z.object({
    name: z.string().min(1),
    subject: z.string().min(1),
    body: z.string().min(1),
    category: z.string().min(1).default("General"),
  }).safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message, "VALIDATION_ERROR", 400);

  // New templates go to the bottom of the list.
  const last = await prisma.emailTemplate.findFirst({
    where: { profileId: profile.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const nextOrder = (last?.order ?? -1) + 1;

  const template = await prisma.emailTemplate.upsert({
    where: { profileId_name: { profileId: profile.id, name: parsed.data.name } },
    update: { subject: parsed.data.subject, body: parsed.data.body, category: parsed.data.category },
    create: { profileId: profile.id, ...parsed.data, order: nextOrder },
  });
  return NextResponse.json({ data: template }, { status: 201 });
}
