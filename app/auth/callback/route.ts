/**
 * GET /auth/callback?code=…&next=/account
 *
 * Target of Supabase email links (sign-up confirmation, password recovery,
 * magic links). Exchanges the one-time code for a session cookie and sends
 * the customer on. Errors land on the sign-in page with a readable message.
 */
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { ACCOUNT_PATHS } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f]/.test(value)) return ACCOUNT_PATHS.home;
  return value;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  const errorDescription = url.searchParams.get("error_description");

  const signIn = new URL(ACCOUNT_PATHS.signIn, url.origin);

  if (errorDescription) {
    signIn.searchParams.set("error", errorDescription);
    return NextResponse.redirect(signIn);
  }
  if (!code) {
    signIn.searchParams.set("error", "That link is missing its confirmation code. Please request a new one.");
    return NextResponse.redirect(signIn);
  }

  const supabase = await createServerSupabase();
  if (!supabase) {
    signIn.searchParams.set("error", "Accounts aren't switched on yet.");
    return NextResponse.redirect(signIn);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    signIn.searchParams.set("error", "That link has expired or was already used. Please sign in or request a new link.");
    return NextResponse.redirect(signIn);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
