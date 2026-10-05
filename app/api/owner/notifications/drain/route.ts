import { hasCronSecret, requireOwner } from "@/lib/admin/ownerAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { drainEmailQueue } from "@/lib/email/queue";
import { drainOwnerNotifications } from "@/lib/notifications/outbox";
import { guardOrigin, getRequestId } from "@/lib/security/withSecurity";
export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";
async function run(req: Request) {
  if (!hasCronSecret(req)) {
    if (req.method !== "POST")
      return new Response("Unauthorized", { status: 401 });
    const deny = guardOrigin(
      req,
      "/api/owner/notifications/drain",
      getRequestId(req),
    );
    if (deny) return deny;
    const a = await requireOwner();
    if (!a.ok) return a.response;
  }
  const db = getSupabaseAdmin();
  if (!db) return Response.json({ error: "Unavailable" }, { status: 503 });
  try {
    return Response.json({
      email: await drainEmailQueue(db),
      notifications: await drainOwnerNotifications(db),
    });
  } catch {
    return Response.json({ error: "Queue unavailable" }, { status: 503 });
  }
}
export const GET = run;
export const POST = run;
