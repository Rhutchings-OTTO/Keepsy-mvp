import { requireOwner } from "@/lib/admin/ownerAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { upsertContact, recordConsentFromOrder } from "@/lib/crm/contacts";
import { guardOrigin, getRequestId } from "@/lib/security/withSecurity";
export async function POST(req: Request) {
  const deny = guardOrigin(req, "/api/crm/backfill", getRequestId(req));
  if (deny) return deny;
  const a = await requireOwner();
  if (!a.ok) return a.response;
  const db = getSupabaseAdmin();
  if (!db) return Response.json({ error: "Unavailable" }, { status: 503 });
  const b = await req.json().catch(() => ({}));
  const offset = Number.isInteger(b.offset) && b.offset >= 0 ? b.offset : 0;
  const source = b.source === "subscribers" ? "subscribers" : "orders";
  try {
    let q = db
      .from(source)
      .select("*")
      .order(source === "orders" ? "order_ref" : "email")
      .range(offset, offset + 99);
    if (source === "orders")
      q = q.in("status", ["paid", "in_production", "shipped", "delivered"]);
    const { data, error } = await q;
    if (error) throw error;
    for (const row of data || []) {
      if (source === "orders")
        await recordConsentFromOrder(db, { ...row, marketing_consent: null });
      else if (row.email)
        await upsertContact(db, { email: row.email, source: "legacy" });
    }
    return Response.json({
      ok: true,
      source,
      processed: data?.length || 0,
      nextOffset: (data?.length || 0) === 100 ? offset + 100 : null,
    });
  } catch {
    return Response.json(
      { error: "Import could not complete; safe to retry this batch." },
      { status: 503 },
    );
  }
}
