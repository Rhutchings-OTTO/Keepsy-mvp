import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Guard: this module must never be imported in client-side code
if (typeof window !== "undefined") {
  throw new Error("[supabaseAdmin] This module must not be imported in client-side code. Check your component boundaries.");
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;

  cachedClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedClient;
}
