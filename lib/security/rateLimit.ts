/**
 * Rate limiting: in-memory (dev) or Upstash Redis (prod).
 * Add RateLimit-* headers to responses.
 */
type WindowState = { count: number; resetAt: number };

const windows = new Map<string, WindowState>();

/** Sliding window: key -> { count, resetAt } */
function checkInMemory(
  key: string,
  limit: number,
  windowSec: number
): { allowed: boolean; remaining: number; resetAt: number; retryAfter?: number } {
  const now = Date.now();
  const resetAt = now + windowSec * 1000;
  const current = windows.get(key);

  if (!current) {
    windows.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (now >= current.resetAt) {
    windows.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  current.count += 1;
  if (current.count > limit) {
    const retryAfter = Math.ceil((current.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, resetAt: current.resetAt, retryAfter };
  }
  return { allowed: true, remaining: limit - current.count, resetAt: current.resetAt };
}

export type RateLimitConfig = {
  windowSec: number;
  limit: number;
};

const ENDPOINT_CONFIG: Record<string, RateLimitConfig> = {
  "/api/generate-image": { windowSec: 60, limit: 5 },
  "generate-hourly": { windowSec: 3600, limit: 20 },
  "/api/create-checkout-session": { windowSec: 60, limit: 10 },
  "/api/upload": { windowSec: 60, limit: 10 },
  "upload-hourly": { windowSec: 3600, limit: 60 },
  "/api/delete-my-data": { windowSec: 60, limit: 5 },
  "/api/admin/mockup-placement": { windowSec: 60, limit: 30 },
  "/api/admin/mockup-placements": { windowSec: 60, limit: 30 },
  "post-default": { windowSec: 60, limit: 30 },
  "get-default": { windowSec: 60, limit: 120 },
};

export function getConfigForEndpoint(pathname: string, method: string): RateLimitConfig {
  if (pathname === "/api/generate-image" && method === "POST") {
    return ENDPOINT_CONFIG["/api/generate-image"];
  }
  if (pathname === "/api/create-checkout-session" && method === "POST") {
    return ENDPOINT_CONFIG["/api/create-checkout-session"];
  }
  if (pathname.includes("/api/upload") && method === "POST") {
    return ENDPOINT_CONFIG["/api/upload"];
  }
  if (pathname === "/api/delete-my-data" && method === "POST") {
    return ENDPOINT_CONFIG["/api/delete-my-data"];
  }
  if (pathname === "/api/admin/mockup-placement") {
    return ENDPOINT_CONFIG["/api/admin/mockup-placement"];
  }
  if (pathname === "/api/admin/mockup-placements" && method === "POST") {
    return ENDPOINT_CONFIG["/api/admin/mockup-placements"];
  }
  if (method === "GET") return ENDPOINT_CONFIG["get-default"];
  return ENDPOINT_CONFIG["post-default"];
}

export function getClientKey(req: Request): string {
  const visitorId = req.headers.get("x-visitor-id")?.trim();
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip");
  return visitorId || forwardedFor || realIp || "anonymous";
}

export type RateLimitResult =
  | { allowed: true; remaining: number; resetAt: number; headers: Record<string, string> }
  | { allowed: false; retryAfter: number; headers: Record<string, string> };

export function rateLimit(
  req: Request,
  pathname: string,
  method: string
): RateLimitResult {
  const config = getConfigForEndpoint(pathname, method);
  const key = `${pathname}:${method}:${getClientKey(req)}`;
  const result = checkInMemory(key, config.limit, config.windowSec);

  const headers: Record<string, string> = {
    "RateLimit-Limit": String(config.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };

  if (result.allowed) {
    return { allowed: true, remaining: result.remaining, resetAt: result.resetAt, headers };
  }
  if (result.retryAfter != null) {
    headers["Retry-After"] = String(result.retryAfter);
  }
  return { allowed: false, retryAfter: result.retryAfter ?? 60, headers };
}
