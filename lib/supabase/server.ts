/**
 * Server-side Supabase client bound to the request cookies (RLS applies —
 * this client acts as the signed-in user, never as the service role).
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "./config";

export async function createServerSupabase(): Promise<SupabaseClient | null> {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) return null;
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: the middleware refreshes sessions instead.
        }
      },
    },
  });
}

/** The signed-in user for this request, or null (guest / auth not configured). */
export async function getSessionUser(): Promise<User | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  } catch {
    return null;
  }
}
