/** Security event logging. Never log secrets or full prompts. */

export type AuditEvent =
  | { type: "rate_limit_hit"; endpoint: string; key: string }
  | { type: "invalid_origin"; endpoint: string; origin: string | null }
  | { type: "validation_fail"; endpoint: string; reason: string }
  | { type: "webhook_sig_fail"; reason: string }
  | { type: "body_too_large"; endpoint: string; size: number };

function sanitize(s: string, maxLen: number): string {
  const t = s.replace(/[\x00-\x1f\x7f]/g, "").trim();
  return t.length > maxLen ? t.slice(0, maxLen) + "..." : t;
}

export function logSecurityEvent(event: AuditEvent, requestId?: string): void {
  const id = requestId ? "[" + sanitize(requestId, 36) + "]" : "";
  const msg = "[SEC]" + id + " " + JSON.stringify(event);
  if (process.env.NODE_ENV === "production") {
    console.warn(msg);
  } else {
    console.info(msg);
  }
}
