/**
 * Session refresh for Next.js middleware (per @supabase/ssr guidance). Keeps
 * the auth cookies fresh on every request and tells the caller who is signed
 * in so protected routes can redirect. No-ops when auth is not configured.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "./config";

export async function refreshSupabaseSession(
  request: NextRequest
): Promise<{ response: NextResponse; user: User | null; configured: boolean }> {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  let response = NextResponse.next({ request });
  if (!url || !key) return { response, user: null, configured: false };

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  let user: User | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user ?? null;
  } catch {
    user = null;
  }
  return { response, user, configured: true };
}
