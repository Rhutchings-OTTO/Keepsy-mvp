/**
 * Public Supabase configuration. Safe for client bundles: only the project URL
 * and the anon/publishable key are read here. The service-role key lives in
 * lib/supabaseAdmin.ts (server-only) and must never be imported by client code.
 */
export function getSupabaseUrl(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || null;
}

export function getSupabaseAnonKey(): string | null {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    null
  );
}

/** True when browser/session auth can run (URL + anon key present). */
export function isSupabaseAuthConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export const ACCOUNT_PATHS = {
  home: "/account",
  signIn: "/account/sign-in",
  signUp: "/account/sign-up",
  forgotPassword: "/account/forgot-password",
  resetPassword: "/account/reset-password",
  callback: "/auth/callback",
  signOut: "/auth/sign-out",
} as const;

/** Account routes that must NOT require a session. */
export const PUBLIC_ACCOUNT_PATHS: ReadonlySet<string> = new Set([
  ACCOUNT_PATHS.signIn,
  ACCOUNT_PATHS.signUp,
  ACCOUNT_PATHS.forgotPassword,
  ACCOUNT_PATHS.resetPassword,
]);
