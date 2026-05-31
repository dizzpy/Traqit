import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError } from "@/lib/utils";

function serialize(p: {
  id: string;
  name: string;
  email: string;
  defaultCurrency: string;
  defaultPipelineTemplateId: string | null;
  ghostThresholdDays: number;
  createdAt: Date;
}) {
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    defaultCurrency: p.defaultCurrency,
    defaultPipelineTemplateId: p.defaultPipelineTemplateId,
    ghostThresholdDays: p.ghostThresholdDays,
    createdAt: p.createdAt,
  };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const meta = user.user_metadata ?? {};
  return NextResponse.json({
    data: {
      ...serialize(profile),
      avatarUrl: (meta.avatar_url as string | undefined) ?? null,
      provider: (user.app_metadata?.provider as string | undefined) ?? null,
    },
  });
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

  const updated = await prisma.profile.update({
    where: { id: profile.id },
    data: parsed.data,
  });
  return NextResponse.json({ data: serialize(updated) });
}

/**
 * Delete the entire account: removes the Profile (which cascades to every
 * application, stage, contact, document, activity, preset and template) and
 * the linked Supabase auth user, then clears the session.
 *
 * The auth user is only removed when SUPABASE_SERVICE_ROLE_KEY is configured;
 * the response reports whether that happened so the UI can be honest.
 */
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  // Cascades clear all owned data (see schema onDelete: Cascade relations).
  await prisma.profile.deleteMany({ where: { userId: user.id } });

  let authDeleted = false;
  const admin = createAdminClient();
  if (admin) {
    const { error } = await admin.auth.admin.deleteUser(user.id);
    authDeleted = !error;
  }

  await supabase.auth.signOut();
  return NextResponse.json({ data: { ok: true, authDeleted } });
}
