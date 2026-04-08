import { NextRequest, NextResponse } from "next/server";
import { getOrCreateProfile } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { password, profileName } = await req.json();

    if (!password || password !== process.env.AUTH_PASSWORD) {
      return NextResponse.json(
        { error: { message: "Invalid password", code: "INVALID_PASSWORD" } },
        { status: 401 }
      );
    }

    if (!profileName?.trim()) {
      return NextResponse.json(
        { error: { message: "Profile name required", code: "MISSING_PROFILE" } },
        { status: 400 }
      );
    }

    const profile = await getOrCreateProfile(profileName.trim());

    const res = NextResponse.json({ data: { profile } });
    const maxAge = 60 * 60 * 24 * 30;

    res.cookies.set("auth-token", password, {
      httpOnly: true,
      path: "/",
      maxAge,
      sameSite: "lax",
    });
    res.cookies.set("profile-id", profile.id, {
      httpOnly: true,
      path: "/",
      maxAge,
      sameSite: "lax",
    });

    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: { message: "Server error", code: "SERVER_ERROR" } },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json({ data: { ok: true } });
  res.cookies.delete("auth-token");
  res.cookies.delete("profile-id");
  return res;
}
