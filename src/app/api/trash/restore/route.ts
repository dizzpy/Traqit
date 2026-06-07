import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";
import { invalidateAppData, invalidate, cacheKey } from "@/lib/redis";

const schema = z.object({
  type: z.enum(["application", "emailTemplate"]),
  ids: z.array(z.string()).min(1).max(1000),
});

/**
 * Restore trashed items (deletedAt → null). Powers both the Trash page's
 * Restore button and the 5-second Undo toast after a delete. Only touches rows
 * that are actually in Trash and owned by the caller.
 */
export async function POST(req: NextRequest) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return apiError(parsed.error.message, "VALIDATION_ERROR", 400);
  const { type, ids } = parsed.data;

  try {
    if (type === "application") {
      await prisma.application.updateMany({
        where: { id: { in: ids }, profileId: profile.id, deletedAt: { not: null } },
        data: { deletedAt: null },
      });
      await invalidateAppData(profile.id);
    } else {
      await prisma.emailTemplate.updateMany({
        where: { id: { in: ids }, profileId: profile.id, deletedAt: { not: null } },
        data: { deletedAt: null },
      });
      await invalidate(cacheKey.emailTemplates(profile.id));
    }
  } catch {
    // Most likely a unique-name clash (a live template now uses that name).
    return apiError("A live item already uses that name — rename it first.", "CONFLICT", 409);
  }

  return NextResponse.json({ data: { ok: true } });
}
