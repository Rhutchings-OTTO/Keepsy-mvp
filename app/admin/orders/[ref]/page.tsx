import { PostalAddress } from "@/components/admin/PostalAddress";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { listOrderEvents } from "@/lib/orders/events";
export default async function Page({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  const db = getSupabaseAdmin();
  if (!db) return <p>Database unavailable.</p>;
  const { data: o, error } = await db
    .from("orders")
    .select("*")
    .eq("order_ref", ref)
    .maybeSingle();
  if (error) return <p>Order could not be loaded.</p>;
  if (!o) notFound();
  const events = await listOrderEvents(db, ref);
  return (
    <>
      <h1 className="font-serif text-3xl break-all">{ref}</h1>
      <div className="my-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-3xl bg-white p-7">
          <h2 className="font-serif text-2xl">Payment &amp; fulfilment</h2>
          <dl className="mt-5 space-y-4">
            {[
              [
                "Payment",
                ["paid", "in_production", "shipped", "delivered"].includes(
                  o.status,
                )
                  ? "Paid"
                  : o.status,
              ],
              [
                "Amount paid",
                o.amount_total_minor == null
                  ? "Not recorded"
                  : new Intl.NumberFormat("en-GB", {
                      style: "currency",
                      currency: o.currency || "GBP",
                    }).format(o.amount_total_minor / 100),
              ],
              [
                "Needs attention",
                o.manual_review_reason?.replace(/_/g, " ") ||
                  "No flagged issue",
              ],
              ["Printify", o.printify_status || "Not submitted"],
              ["Printify order", o.printify_order_id || "—"],
              ["Stripe checkout", o.stripe_session_id],
              [
                "Delivery country",
                o.shipping_country || o.destination_country || "—",
              ],
              ["Discount", o.discount_code || "None"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-black/50">{k}</dt>
                <dd className="break-all">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="rounded-3xl bg-white p-7">
          <h2 className="font-serif text-2xl">Customer</h2>
          <p className="mt-5">{o.customer_name}</p>
          <p>{o.customer_email}</p>
          <div className="mt-5">
            <PostalAddress value={o.shipping_address} />
          </div>
        </section>
      </div>
      <h2 className="mb-5 font-serif text-2xl">Order timeline</h2>
      <ol className="space-y-4">
        {events.map((e) => (
          <li key={e.id} className="rounded-2xl border border-black/10 p-5">
            <p>{e.type.replace(/_/g, " ")}</p>
            <p className="mt-1 text-xs text-black/50">
              {new Date(e.created_at).toLocaleString("en-GB")} · {e.source}
            </p>
            {e.data && Object.keys(e.data).length > 0 && (
              <details className="mt-3 text-xs">
                <summary className="cursor-pointer text-black/50">
                  Technical record
                </summary>
                <pre className="mt-3 overflow-auto">
                  {JSON.stringify(e.data, null, 2)}
                </pre>
              </details>
            )}
          </li>
        ))}
      </ol>
      {!events.length && (
        <p>No timeline events were recorded for this older order.</p>
      )}
    </>
  );
}
