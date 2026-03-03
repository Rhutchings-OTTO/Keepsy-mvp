/** Origin/Host allowlist for state-changing requests. */
const ALLOWED_ORIGINS = [
  "https://keepsy.store",
  "https://www.keepsy.store",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const VERCEL_APP = /^https:\/\/[a-z0-9-_.]+\.vercel\.app$/;

export function isOriginAllowed(origin: string | null): boolean {
  if (!origin || origin === "null") return false;
  const o = origin.trim().toLowerCase();
  if (ALLOWED_ORIGINS.includes(o)) return true;
  if (VERCEL_APP.test(o)) return true;
  return false;
}

export function checkOrigin(req: Request): { ok: true } | { ok: false; origin: string | null } {
  const origin = req.headers.get("origin");
  if (isOriginAllowed(origin)) return { ok: true };
  return { ok: false, origin };
}
