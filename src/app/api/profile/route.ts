import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError } from "@/lib/utils";
import { cached, invalidate, cacheKey, TTL } from "@/lib/redis";
import type { Plan } from "@prisma/client";

function serialize(p: {
  id: string;
  name: string;
  email: string;
  defaultCurrency: string;
  defaultPipelineTemplateId: string | null;
  ghostThresholdDays: number;
  emailName: string | null;
  remindersEnabled: boolean;
  reminderLeadTime: number;
  onboardedAt: Date | null;
  createdAt: Date;
  subscription?: { plan: Plan } | null;
}) {
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    defaultCurrency: p.defaultCurrency,
    defaultPipelineTemplateId: p.defaultPipelineTemplateId,
    ghostThresholdDays: p.ghostThresholdDays,
    emailName: p.emailName,
    remindersEnabled: p.remindersEnabled,
    reminderLeadTime: p.reminderLeadTime,
    onboardedAt: p.onboardedAt,
    createdAt: p.createdAt,
    // Defensive default: any profile missing a subscription row reads as FREE.
    plan: p.subscription?.plan ?? "FREE",
  };
}

// Allowed reminder lead times (hours), shared with the profile UI.
const REMINDER_LEAD_TIMES = [1, 3, 24, 48] as const;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  // Cache only the DB-backed profile — avatar/provider come from the live session.
  const profile = await cached(cacheKey.profile(user.id), TTL.PROFILE, () =>
    prisma.profile.findUnique({ where: { userId: user.id }, include: { subscription: true } })
  );
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const meta = user.user_metadata ?? {};
  return NextResponse.json(
    {
      data: {
        ...serialize(profile),
        avatarUrl: (meta.avatar_url as string | undefined) ?? null,
        provider: (user.app_metadata?.provider as string | undefined) ?? null,
      },
    },
    { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=300" } }
  );
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
    emailName: z.string().max(60).nullable().optional(),
    remindersEnabled: z.boolean().optional(),
    reminderLeadTime: z.number().int().refine((v) => (REMINDER_LEAD_TIMES as readonly number[]).includes(v), {
      message: "reminderLeadTime must be one of 1, 3, 24, 48",
    }).optional(),
    onboardedAt: z.string().datetime().nullable().optional(),
  }).safeParse(body);
  if (!parsed.success) return apiError(parsed.error.message, "VALIDATION_ERROR", 400);

  // onboardedAt arrives as an ISO string (or null) — Prisma needs a Date.
  const { onboardedAt, ...rest } = parsed.data;
  const data = {
    ...rest,
    ...(onboardedAt !== undefined ? { onboardedAt: onboardedAt ? new Date(onboardedAt) : null } : {}),
  };

  const updated = await prisma.profile.update({
    where: { id: profile.id },
    data,
    include: { subscription: true },
  });
  await invalidate(cacheKey.profile(updated.userId));
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
  await invalidate(cacheKey.profile(user.id));

  let authDeleted = false;
  const admin = createAdminClient();
  if (admin) {
    const { error } = await admin.auth.admin.deleteUser(user.id);
    authDeleted = !error;
  }

  await supabase.auth.signOut();
  return NextResponse.json({ data: { ok: true, authDeleted } });
}
