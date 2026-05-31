import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { apiError } from "@/lib/utils";

export async function GET() {
  const profile = await getProfile();
  if (!profile) return apiError("Unauthorized", "UNAUTHORIZED", 401);

  return NextResponse.json({ data: { id: profile.id, name: profile.name } });
}
