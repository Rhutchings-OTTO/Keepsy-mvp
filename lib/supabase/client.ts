"use client";

/**
 * Browser Supabase client (anon key + user session cookies). Returns null when
 * auth is not configured so callers can render an honest "not switched on" state.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "./config";

let cached: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient | null {
  if (cached) return cached;
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) return null;
  cached = createBrowserClient(url, key);
  return cached;
}
