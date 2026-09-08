/**
 * POST /auth/sign-out — clears the Supabase session cookie and returns home.
 * POST only (a GET link could be triggered by prefetching).
 */
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { guardOrigin, getRequestId } from "@/lib/security/withSecurity";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const originDeny = guardOrigin(req, "/auth/sign-out", getRequestId(req));
  if (originDeny) return originDeny;

  const supabase = await createServerSupabase();
  if (supabase) {
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/", req.url), { status: 303 });
}
