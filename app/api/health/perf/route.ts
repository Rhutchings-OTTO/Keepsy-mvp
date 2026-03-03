import { NextResponse } from "next/server";
import { getGenerationMetrics } from "@/app/api/generate-image/metrics";
import { guardRateLimit, getRequestId } from "@/lib/security/withSecurity";

export async function GET(req: Request) {
  const requestId = getRequestId(req);
  const rl = guardRateLimit(req, "/api/health/perf", "GET", requestId);
  if ("response" in rl) return rl.response;
  const perfKey = process.env.PERF_DASHBOARD_KEY;
  const isProd = process.env.NODE_ENV === "production";
  if (isProd && !perfKey) {
    return NextResponse.json(
      { ok: false, error: "Performance endpoint disabled in production without PERF_DASHBOARD_KEY." },
      { status: 403 }
    );
  }
  if (isProd && perfKey) {
    const providedKey = req.headers.get("x-perf-key");
    if (providedKey !== perfKey) {
      return NextResponse.json(
        { ok: false, error: "Provide x-perf-key header via a protected internal client." },
        { status: 401 }
      );
    }
  }

  const generation = getGenerationMetrics();
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    generation,
  });
}

