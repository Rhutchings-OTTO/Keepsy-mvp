/**
 * Comprehensive health check endpoint.
 * Tests Supabase connectivity and checks required env vars are present.
 * Returns 200 with status "healthy" or "degraded".
 * Cacheable for 30 seconds.
 */

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { guardRateLimit, getRequestId } from "@/lib/security/withSecurity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request): Promise<Response> {
  const requestId = getRequestId(req);
  const rl = await guardRateLimit(req, "/api/health", "GET", requestId);
  if ("response" in rl) return rl.response;

  // ── Env var presence checks (values never exposed) ──────────────────────
  const stripeKey = process.env.STRIPE_SECRET_KEY ? "ok" : "missing";
  const printifyKey = process.env.PRINTIFY_API_TOKEN ? "ok" : "missing";
  const resendKey = process.env.RESEND_API_KEY ? "ok" : "missing";

  // ── Supabase connectivity check ──────────────────────────────────────────
  let supabaseStatus: "ok" | "error" = "error";
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      // Lightweight query — just check connectivity
      const { error } = await supabase.from("orders").select("order_ref").limit(1);
      supabaseStatus = error ? "error" : "ok";
    } catch {
      supabaseStatus = "error";
    }
  }

  const checks = {
    supabase: supabaseStatus,
    stripe_key: stripeKey as "ok" | "missing",
    printify_key: printifyKey as "ok" | "missing",
    resend_key: resendKey as "ok" | "missing",
  };

  const overallHealthy =
    checks.supabase === "ok" &&
    checks.stripe_key === "ok" &&
    checks.printify_key === "ok" &&
    checks.resend_key === "ok";

  const result = {
    status: overallHealthy ? "healthy" : "degraded",
    checks,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(result, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=30, s-maxage=30",
    },
  });
}
