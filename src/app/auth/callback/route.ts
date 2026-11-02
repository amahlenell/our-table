import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const recovery = request.nextUrl.searchParams.get("type") === "recovery";
  if (code) {
    const db = await supabase();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(
        new URL(recovery ? "/auth/update-password" : "/settings", request.url),
      );
  }
  return NextResponse.redirect(
    new URL("/auth/login?error=confirmation", request.url),
  );
}
