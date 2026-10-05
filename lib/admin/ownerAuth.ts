/**
 * Owner (store operator) authentication.
 *
 * There is no separate admin login. An owner is a normal Supabase Auth user
 * (email + password, confirmed) whose email is on the OWNER_EMAILS allowlist.
 * Everything under /admin/* and the owner API routes requires this.
 *
 *   OWNER_EMAILS="rory@keepsy.store,dan@keepsy.store"
 *
 * Legacy machine access (scripts, curl) keeps working on the two existing
 * operational routes through ADMIN_API_KEY (see requireOwnerOrApiKey).
 *
 * Server-only. Do not import from client components or middleware (use
 * lib/admin/ownerAllowlist.ts there).
 */
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/supabase/server";
import { isOwnerUser } from "@/lib/admin/ownerAllowlist";

export {
  isOwnerEmail,
  isOwnerUser,
  ownerAllowlist,
} from "@/lib/admin/ownerAllowlist";

export type OwnerSession = { user: User; email: string };

/** Owner session for server components / route handlers, or null. */
export async function getOwnerSession(): Promise<OwnerSession | null> {
  const user = await getSessionUser();
  if (!isOwnerUser(user)) return null;
  return { user: user as User, email: (user as User).email as string };
}

export type OwnerGuardResult =
  | { ok: true; owner: OwnerSession }
  | { ok: false; response: Response };

/** Route-handler guard: 401 when not signed in, 403 when signed in but not an owner. */
export async function requireOwner(): Promise<OwnerGuardResult> {
  const user = await getSessionUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "UNAUTHENTICATED", message: "Sign in as the store owner." },
        { status: 401 },
      ),
    };
  }
  if (!isOwnerUser(user)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "FORBIDDEN", message: "This account is not an owner." },
        { status: 403 },
      ),
    };
  }
  return { ok: true, owner: { user, email: user.email as string } };
}

/**
 * Owner session OR the legacy ADMIN_API_KEY header. Use only on the existing
 * operational endpoints (retry-order, reconcile) so scripts keep working.
 */
export async function requireOwnerOrApiKey(
  req: Request,
): Promise<OwnerGuardResult> {
  const adminKey = process.env.ADMIN_API_KEY;
  const incoming = req.headers.get("x-admin-key");
  if (adminKey && incoming && timingSafeEqualString(incoming, adminKey)) {
    // Machine caller — represent as a synthetic owner identity for audit lines.
    return {
      ok: true,
      owner: {
        user: {
          id: "admin-api-key",
          email: "admin-api-key",
        } as unknown as User,
        email: "admin-api-key",
      },
    };
  }
  return requireOwner();
}

/** Bearer secret guard for cron-style callers (e.g. Vercel Cron) — CRON_SECRET. */
export function hasCronSecret(
  req: Request,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const secret = env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || !auth.startsWith("Bearer ")) return false;
  return timingSafeEqualString(auth.slice(7), secret);
}

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1)
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
