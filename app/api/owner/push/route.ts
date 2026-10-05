import { z } from "zod";
import { requireOwner } from "@/lib/admin/ownerAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  validPushEndpoint,
  enqueueOwnerNotification,
} from "@/lib/notifications/outbox";
import { guardOrigin, getRequestId } from "@/lib/security/withSecurity";
const schema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(30).max(200),
    auth: z.string().min(10).max(100),
  }),
});
export async function GET() {
  const a = await requireOwner();
  if (!a.ok) return a.response;
  return Response.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
}
export async function POST(req: Request) {
  const deny = guardOrigin(req, "/api/owner/push", getRequestId(req));
  if (deny) return deny;
  const a = await requireOwner();
  if (!a.ok) return a.response;
  const db = getSupabaseAdmin();
  if (!db) return Response.json({ error: "Unavailable" }, { status: 503 });
  const b = schema.safeParse(await req.json().catch(() => null));
  if (!b.success || !validPushEndpoint(b.data.endpoint))
    return Response.json({ error: "Invalid subscription" }, { status: 400 });
  const { data: existing } = await db
    .from("owner_push_subscriptions")
    .select("user_id")
    .eq("endpoint", b.data.endpoint)
    .maybeSingle();
  if (existing && existing.user_id !== a.owner.user.id)
    return Response.json(
      { error: "Device belongs to another account" },
      { status: 409 },
    );
  const { error } = await db.from("owner_push_subscriptions").upsert(
    {
      endpoint: b.data.endpoint,
      p256dh: b.data.keys.p256dh,
      auth: b.data.keys.auth,
      user_id: a.owner.user.id,
      disabled_at: null,
    },
    { onConflict: "endpoint" },
  );
  if (error)
    return Response.json({ error: "Could not save device" }, { status: 503 });
  await db.from("owner_alert_prefs").upsert(
    {
      user_id: a.owner.user.id,
      email: a.owner.email.toLowerCase(),
      push_enabled: true,
    },
    { onConflict: "user_id" },
  );
  await enqueueOwnerNotification(db, {
    key: "device:" + a.owner.user.id + ":" + Date.now(),
    kind: "test",
    title: "Keepsy alerts are ready",
    body: "New orders and fulfilment issues will appear here.",
    severity: "info",
  });
  return Response.json({ ok: true });
}
