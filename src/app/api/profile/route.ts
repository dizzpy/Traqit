import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";

function serialize(p: {
  id: string;
  name: string;
  defaultCurrency: string;
  defaultPipelineTemplateId: string | null;
  ghostThresholdDays: number;
}) {
  return {
    id: p.id,
    name: p.name,
    defaultCurrency: p.defaultCurrency,
    defaultPipelineTemplateId: p.defaultPipelineTemplateId,
    ghostThresholdDays: p.ghostThresholdDays,
  };
}

export async function GET() {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);
  return NextResponse.json({ data: serialize(profile) });
}

export async function PATCH(req: NextRequest) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const body = await req.json();
  const parsed = z.object({
    name: z.string().min(1).max(60).optional(),
    defaultCurrency: z.string().min(1).optional(),
    defaultPipelineTemplateId: z.string().nullable().optional(),
    ghostThresholdDays: z.number().int().min(1).max(365).optional(),
  }).safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message, "VALIDATION_ERROR", 400);

  // Name is the unique login key — guard against collisions with a friendly message.
  if (parsed.data.name && parsed.data.name !== profile.name) {
    const clash = await prisma.profile.findUnique({ where: { name: parsed.data.name } });
    if (clash) return apiError("That name is already taken", "NAME_TAKEN", 409);
  }

  const updated = await prisma.profile.update({
    where: { id: profile.id },
    data: parsed.data,
  });
  return NextResponse.json({ data: serialize(updated) });
}
