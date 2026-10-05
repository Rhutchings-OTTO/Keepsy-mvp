import { PostalAddress } from "@/components/admin/PostalAddress";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/i.test(id)) notFound();
  const db = getSupabaseAdmin();
  if (!db) return <p>Database unavailable.</p>;
  const { data: c } = await db
    .from("contacts")
    .select("id,email,first_name,last_name,marketing_status,country")
    .eq("id", id)
    .maybeSingle();
  if (!c) notFound();
  const [{ data: orders }, { data: events }] = await Promise.all([
    db
      .from("orders")
      .select("order_ref,shipping_address,status,total_gbp,currency,created_at")
      .eq("contact_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
    db
      .from("contact_events")
      .select("id,type,consent_text,source,created_at")
      .eq("contact_id", id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  return (
    <>
      <h1 className="break-all font-serif text-3xl">{c.email}</h1>
      <p className="my-5">
        {[c.first_name, c.last_name].filter(Boolean).join(" ")} ·{" "}
        {c.country || "Country not recorded"} · Marketing:{" "}
        {c.marketing_status.replace(/_/g, " ")}
      </p>
      <div className="grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="mb-5 font-serif text-2xl">Orders &amp; addresses</h2>
          {orders?.map((o) => (
            <article
              className="mb-4 rounded-2xl bg-white p-5"
              key={o.order_ref}
            >
              <Link
                className="underline"
                href={"/admin/orders/" + encodeURIComponent(o.order_ref)}
              >
                {o.order_ref}
              </Link>
              <p className="mt-2 text-sm">
                {o.status} ·{" "}
                {new Date(o.created_at).toLocaleDateString("en-GB")}
              </p>
              <div className="mt-5">
                <PostalAddress value={o.shipping_address} />
              </div>
            </article>
          ))}
          {!orders?.length && <p>No orders linked yet.</p>}
        </section>
        <section>
          <h2 className="mb-5 font-serif text-2xl">Contact history</h2>
          {events?.map((e) => (
            <article
              key={e.id}
              className="mb-4 rounded-2xl border border-black/10 p-5"
            >
              <p>{e.type.replace(/_/g, " ")}</p>
              <p className="mt-2 text-xs text-black/50">
                {new Date(e.created_at).toLocaleString("en-GB")} · {e.source}
              </p>
              {e.consent_text && (
                <p className="mt-3 text-sm">{e.consent_text}</p>
              )}
            </article>
          ))}
        </section>
      </div>
    </>
  );
}
