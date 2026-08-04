import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

/**
 * The tap-the-link half of signup confirmation.
 *
 * The shared email template keeps its "Confirm Email Address" button alongside
 * the code, so both paths have to land somewhere that establishes a session.
 * Typing the code goes through `verifySignupOtp` in `app/(auth)/actions.ts`;
 * the link arrives here with a `token_hash` instead.
 *
 * Note this is `app/auth/`, not the `(auth)` route group — a real URL segment,
 * because Supabase has to be able to link to it.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const failed = new URL("/login?error=confirmation_failed", request.url);
  if (!tokenHash || type !== "signup") {
    return NextResponse.redirect(failed);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type: "signup",
    token_hash: tokenHash,
  });
  if (error) {
    console.error("[auth] link confirmation failed", error.message);
    return NextResponse.redirect(failed);
  }

  return NextResponse.redirect(
    new URL(safeNext(searchParams.get("next")), request.url),
  );
}
