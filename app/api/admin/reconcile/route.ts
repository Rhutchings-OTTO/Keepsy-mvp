/**
 * Admin: Manual Reconciliation Trigger
 * ─────────────────────────────────────────────────────────────
 * Manually fires the Stripe webhook reconciliation job for
 * debugging and operational purposes.
 *
 * Protected by the ADMIN_API_KEY environment variable.
 *
 * Usage:
 *   curl -X POST https://keepsy.store/api/admin/reconcile \
 *     -H "x-admin-key: <ADMIN_API_KEY>"
 */

import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // ── Auth guard ──────────────────────────────────────────────────────────────
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    return NextResponse.json(
      { error: "ADMIN_API_KEY not configured on this server." },
      { status: 500 }
    );
  }

  const incomingKey = req.headers.get("x-admin-key");
  if (!incomingKey || incomingKey !== adminKey) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // ── Trigger the reconciliation Inngest function ─────────────────────────────
  // We send a one-off event that the reconcileOrders function also listens to,
  // OR we rely on the cron event name. The simplest approach: send a dedicated
  // manual-trigger event that the function handles via an additional trigger.
  //
  // Since Inngest cron functions cannot be manually invoked via event (they are
  // cron-only), we instead re-use the inngest.send pattern to emit a custom event
  // that the reconcile function also reacts to.
  //
  // NOTE: The reconcileOrders function is registered with a cron trigger only.
  // To support manual invocation, we emit a "keepsy/reconcile.requested" event
  // here. The reconcile-orders function handles both the cron AND this event.
  try {
    await inngest.send({
      name: "keepsy/reconcile.requested",
      data: {
        triggeredBy: "admin-api",
        triggeredAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Reconciliation job triggered. Check the Inngest dashboard for progress.",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin/reconcile] Failed to trigger reconciliation:", msg);
    return NextResponse.json(
      { error: "Failed to trigger reconciliation: " + msg },
      { status: 500 }
    );
  }
}
