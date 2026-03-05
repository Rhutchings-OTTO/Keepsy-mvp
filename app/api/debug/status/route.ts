/**
 * Debug panel status API — OpenAI, Stripe, Image Host.
 * Protected by DEBUG_PANEL_KEY (or PERF_DASHBOARD_KEY fallback).
 * Never expose sensitive keys. Only status and non-secret metadata.
 */
import { NextResponse } from "next/server";
import { uploadImageToCloudinary } from "@/lib/uploadImage";
import { guardRateLimit, getRequestId } from "@/lib/security/withSecurity";

const TINY_PIXEL_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function getDebugKey(): string | undefined {
  return process.env.DEBUG_PANEL_KEY ?? process.env.PERF_DASHBOARD_KEY;
}

function guard(req: Request): Response | null {
  const key = getDebugKey();
  const isProd = process.env.NODE_ENV === "production";
  if (isProd && !key) {
    return NextResponse.json({ error: "Debug panel disabled." }, { status: 403 });
  }
  if (key) {
    const provided = req.headers.get("x-debug-key") ?? new URL(req.url).searchParams.get("key");
    if (provided !== key) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }
  return null;
}

export async function GET(req: Request) {
  const requestId = getRequestId(req);
  const rl = guardRateLimit(req, "/api/debug/status", "GET", requestId);
  if ("response" in rl) return rl.response;

  const denied = guard(req);
  if (denied) return denied;

  const openaiKey = process.env.OPENAI_API_KEY;
  let openaiStatus: {
    configured: boolean;
    pingMs: number | null;
    error?: string;
    creditsNote: string;
  } = {
    configured: Boolean(openaiKey),
    pingMs: null,
    creditsNote: "Check platform.openai.com/usage for usage and credits.",
  };

  if (openaiKey) {
    const start = Date.now();
    try {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${openaiKey}` },
        signal: AbortSignal.timeout(8000),
      });
      openaiStatus.pingMs = Date.now() - start;
      if (!res.ok) {
        const body = await res.text();
        openaiStatus.error = `API ${res.status}: ${body.slice(0, 100)}`;
      }
    } catch (e) {
      openaiStatus.pingMs = Date.now() - start;
      openaiStatus.error = e instanceof Error ? e.message : "Request failed";
    }
  } else {
    openaiStatus.error = "OPENAI_API_KEY not set";
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeStatus = {
    configured: Boolean(stripeKey),
    mode: stripeKey?.startsWith("sk_live_") ? "Live" : stripeKey?.startsWith("sk_test_") ? "Test" : "Unknown",
    webhookConfigured: Boolean(webhookSecret),
    webhookNote: webhookSecret ? "Configure Stripe CLI or Dashboard to send events to your webhook URL." : "STRIPE_WEBHOOK_SECRET not set.",
  };

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const cloudKey = process.env.CLOUDINARY_API_KEY;
  const cloudSecret = process.env.CLOUDINARY_API_SECRET;
  let imageHostStatus: {
    provider: "Cloudinary" | "None";
    configured: boolean;
    testUploadOk: boolean | null;
    error?: string;
  } = {
    provider: cloudName && cloudKey && cloudSecret ? "Cloudinary" : "None",
    configured: Boolean(cloudName && cloudKey && cloudSecret),
    testUploadOk: null,
  };

  if (imageHostStatus.configured) {
    const testDataUrl = `data:image/png;base64,${TINY_PIXEL_B64}`;
    try {
      const result = await uploadImageToCloudinary(testDataUrl);
      imageHostStatus.testUploadOk = result.ok;
      if (!result.ok) imageHostStatus.error = result.error;
    } catch (e) {
      imageHostStatus.testUploadOk = false;
      imageHostStatus.error = e instanceof Error ? e.message : "Upload test failed";
    }
  } else {
    imageHostStatus.error = "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET not set.";
  }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    openai: openaiStatus,
    stripe: stripeStatus,
    imageHost: imageHostStatus,
  });
}
