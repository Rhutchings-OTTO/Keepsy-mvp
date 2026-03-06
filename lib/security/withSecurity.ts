/** Route guards: origin check, rate limit. */
import { checkOrigin } from "./origin";
import { rateLimit, getClientKey } from "./rateLimit";
import { logSecurityEvent } from "./auditLog";
import { toErrorResponse, ErrorCodes } from "@/lib/http/errors";

export function getRequestId(req: Request): string {
  return req.headers.get("x-request-id") || crypto.randomUUID().slice(0, 8);
}

export function guardOrigin(req: Request, pathname: string, requestId?: string): Response | null {
  const result = checkOrigin(req);
  if (result.ok) return null;
  logSecurityEvent({ type: "invalid_origin", endpoint: pathname, origin: result.origin }, requestId);
  const { body, status, headers } = toErrorResponse(
    ErrorCodes.INVALID_ORIGIN,
    "Invalid or missing Origin header."
  );
  return new Response(JSON.stringify(body), { status, headers });
}

export async function guardRateLimit(
  req: Request,
  pathname: string,
  method: string,
  requestId?: string
): Promise<{ response: Response } | { headers: Record<string, string> }> {
  const result = await rateLimit(req, pathname, method);
  if (result.allowed) return { headers: result.headers };
  logSecurityEvent(
    { type: "rate_limit_hit", endpoint: pathname, key: getClientKey(req).slice(0, 20) + "..." },
    requestId
  );
  const message =
    "atelierMessage" in result && result.atelierMessage
      ? result.atelierMessage
      : "Too many requests. Please try again later.";
  const { body, status, headers } = toErrorResponse(
    ErrorCodes.RATE_LIMITED,
    message,
    { retryAfter: result.retryAfter }
  );
  return {
    response: new Response(JSON.stringify(body), {
      status,
      headers: { ...headers, ...result.headers },
    }),
  };
}
