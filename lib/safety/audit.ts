/**
 * Server-side safety audit logging. No full user prompts stored.
 */

export type SafetyEventType = "rewrite_applied" | "hard_block" | "soft_warning";

export type AuditPayload = {
  clientId?: string;
  promptLen?: number;
  reasonCode?: string;
  similarityScore?: number;
  patchCount?: number;
};

export function logSafetyEvent(
  eventType: SafetyEventType,
  reasonCode: string,
  payload?: AuditPayload
): void {
  const entry = {
    ts: new Date().toISOString(),
    event: eventType,
    reason: reasonCode,
    promptLen: payload?.promptLen,
    clientHash: payload?.clientId ? hashClientId(payload.clientId) : undefined,
  };
  const msg = `[safety] ${JSON.stringify(entry)}`;
  if (process.env.NODE_ENV === "production") {
    console.warn(msg);
  } else {
    console.info(msg);
  }
}

function hashClientId(id: string): string {
  if (typeof id !== "string" || id.length < 4) return "***";
  const lastOctet = id.split(".").pop();
  if (lastOctet && /^\d+$/.test(lastOctet)) {
    return `x.x.x.${lastOctet}`;
  }
  return id.slice(0, 4) + "***";
}
