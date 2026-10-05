/** Public site URL + unsubscribe URL builders (server-side). */

export function getSiteUrl(env: NodeJS.ProcessEnv = process.env): string {
  return (
    env.NEXT_PUBLIC_SITE_URL ||
    env.SITE_URL ||
    "https://keepsy.store"
  ).replace(/\/$/, "");
}

/** Human page: shows a confirm button; nothing happens on GET. */
export function unsubscribePageUrl(
  token: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  return `${getSiteUrl(env)}/unsubscribe?token=${encodeURIComponent(token)}`;
}

/** Machine endpoint for RFC 8058 one-click (POST List-Unsubscribe=One-Click). */
export function unsubscribeOneClickUrl(
  token: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  return `${getSiteUrl(env)}/api/crm/unsubscribe?token=${encodeURIComponent(token)}`;
}

export function getEmailFrom(env: NodeJS.ProcessEnv = process.env): string {
  return env.EMAIL_FROM || "Keepsy <hello@keepsy.store>";
}

export const SUPPORT_EMAIL = "hello@keepsy.store";
