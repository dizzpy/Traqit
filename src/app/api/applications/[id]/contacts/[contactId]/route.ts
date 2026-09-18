import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";

const updateSchema = z.object({
  type: z.enum(["PERSON", "COMPANY"]).optional(),
  name: z.string().min(1).optional(),
  role: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
  stageName: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);
  const { id, contactId } = await params;

  const app = await prisma.application.findFirst({
    where: { id, profileId: profile.id },
  });
  if (!app) return apiError("Not found", "NOT_FOUND", 404);

  const existing = await prisma.contact.findFirst({
    where: { id: contactId, applicationId: id },
  });
  if (!existing) return apiError("Contact not found", "NOT_FOUND", 404);

  const parsed = updateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success)
    return apiError(parsed.error.message, "VALIDATION_ERROR", 400);

  // Role is required for PERSON, optional for COMPANY — checked against the
  // effective merged state so patching just one side of the pair can't leave
  // a PERSON contact with no role.
  const effectiveType = parsed.data.type ?? existing.type;
  const effectiveRole =
    parsed.data.role !== undefined ? parsed.data.role : existing.role;
  if (effectiveType === "PERSON" && !effectiveRole?.trim()) {
    return apiError(
      "Role is required for a person contact",
      "VALIDATION_ERROR",
      400,
    );
  }

  const contact = await prisma.contact.update({
    where: { id: contactId },
    data: parsed.data,
  });
  return NextResponse.json({ data: contact });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);
  const { id, contactId } = await params;

  const app = await prisma.application.findFirst({
    where: { id, profileId: profile.id },
  });
  if (!app) return apiError("Not found", "NOT_FOUND", 404);

  await prisma.contact.deleteMany({
    where: { id: contactId, applicationId: id },
  });
  return NextResponse.json({ data: { ok: true } });
}
