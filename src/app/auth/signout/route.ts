import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Clears the Supabase session and returns ok. Called from the Settings page. */
export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ data: { ok: true } }, {
    headers: { "Cache-Control": "no-store" },
  });
}
