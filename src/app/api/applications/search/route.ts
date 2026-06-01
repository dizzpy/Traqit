import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";

/**
 * Lightweight application list for pickers (e.g. the email-template compose
 * dropdown). Returns only the fields those pickers render plus contacts —
 * never the full nested object — so it replaces the old `?limit=1000` call
 * that pulled stages/documents/activity for every row.
 */
export async function GET(req: NextRequest) {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";

  const apps = await prisma.application.findMany({
    where: {
      profileId: profile.id,
      ...(q
        ? {
            OR: [
              { companyName: { contains: q, mode: "insensitive" } },
              { position: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      companyName: true,
      position: true,
      jobPostUrl: true,
      status: true,
      contacts: {
        select: { id: true, name: true, email: true, role: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ data: apps });
}
