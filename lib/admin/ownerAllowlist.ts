/**
 * Pure owner-allowlist helpers (no Next.js imports) so middleware (edge) and
 * route handlers share one definition. See lib/admin/ownerAuth.ts.
 */
type UserLike =
  | {
      email?: string | null;
      email_confirmed_at?: string | null;
      confirmed_at?: string | null;
    }
  | null
  | undefined;

export function ownerAllowlist(env: NodeJS.ProcessEnv = process.env): string[] {
  return (env.OWNER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes("@"));
}

export function isOwnerEmail(
  email: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (!email) return false;
  const list = ownerAllowlist(env);
  return list.length > 0 && list.includes(email.trim().toLowerCase());
}

/** True when the signed-in user is a confirmed owner. */
export function isOwnerUser(
  user: UserLike,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (!user?.email) return false;
  // Email must be confirmed: an unconfirmed signup with an owner address is not an owner.
  if (!user.email_confirmed_at) return false;
  return isOwnerEmail(user.email, env);
}
