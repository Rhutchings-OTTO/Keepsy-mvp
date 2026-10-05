import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { suppressEmail } from "@/lib/crm/contacts";
export const runtime = "nodejs";
export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET,
    db = getSupabaseAdmin();
  if (!secret || !db) return new Response("Unavailable", { status: 503 });
  let event;
  try {
    event = new Resend(
      process.env.RESEND_API_KEY || "verification-only",
    ).webhooks.verify({
      payload: await req.text(),
      headers: {
        id: req.headers.get("svix-id") || "",
        timestamp: req.headers.get("svix-timestamp") || "",
        signature: req.headers.get("svix-signature") || "",
      },
      webhookSecret: secret,
    });
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }
  const id = req.headers.get("svix-id")!;
  const { data: existing, error: lookupError } = await db
    .from("email_events")
    .select("id")
    .eq("provider_event_id", id)
    .maybeSingle();
  if (lookupError) return new Response("Retry", { status: 503 });
  if (existing) return new Response("OK");
  try {
    const d = event.data as { email_id?: string; to?: string[] };
    if (["email.bounced", "email.complained"].includes(event.type))
      for (const email of d.to || [])
        await suppressEmail(
          db,
          email,
          event.type === "email.bounced" ? "bounce" : "complaint",
        );
    if (event.type === "email.delivered" && d.email_id) {
      const { error } = await db
        .from("email_queue")
        .update({ delivered_at: new Date().toISOString() })
        .eq("provider_message_id", d.email_id);
      if (error) throw error;
    }
    const { error } = await db.from("email_events").insert({
      provider_event_id: id,
      event_type: event.type,
      provider_message_id: d.email_id || null,
    });
    if (error && error.code !== "23505") throw error;
    return new Response("OK");
  } catch {
    return new Response("Retry", { status: 503 });
  }
}
