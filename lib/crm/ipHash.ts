/**
 * Consent evidence stores a salted SHA-256 of the client IP, never the IP.
 * Without CRM_IP_SALT we store null (and say so once in the server log) —
 * an unsalted hash of an IPv4 address is trivially reversible.
 */
import { sha256Hex } from "@/lib/crypto/sha256";

let warned = false;

export function clientIpFromHeaders(headers: Headers): string | null {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || null;
}

export async function hashIp(
  ip: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
): Promise<string | null> {
  if (!ip) return null;
  const salt = env.CRM_IP_SALT;
  if (!salt || salt.length < 16) {
    if (!warned) {
      warned = true;
      console.warn(
        "[crm] CRM_IP_SALT not set (min 16 chars) — consent records will store ip_hash = null.",
      );
    }
    return null;
  }
  return sha256Hex(`${salt}:${ip}`);
}

/** Trim + cap the UA so we never store arbitrary-length client strings. */
export function safeUserAgent(ua: string | null | undefined): string | null {
  if (!ua) return null;
  const s = ua.trim();
  return s ? s.slice(0, 256) : null;
}
