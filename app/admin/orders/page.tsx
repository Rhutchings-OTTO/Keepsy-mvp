import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
export default async function Page() {
  const db = getSupabaseAdmin();
  const result = db
    ? await db
        .from("orders")
        .select(
          "order_ref,customer_email,status,printify_status,currency,total_gbp,created_at",
        )
        .order("created_at", { ascending: false })
        .limit(100)
    : null;
  return (
    <>
      <h1 className="font-serif text-4xl">Orders</h1>
      <p className="my-5 text-black/60">
        Payments, production and delivery in one place. Showing the latest 100
        orders.
      </p>
      {!result || result.error ? (
        <p role="alert">
          Orders are unavailable. Check the database connection and migrations.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-black/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                {["Order", "Customer", "Payment", "Fulfilment", "Total"].map(
                  (h) => (
                    <th className="p-5" key={h}>
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {result.data.map((o) => (
                <tr className="border-t border-black/5" key={o.order_ref}>
                  <td className="p-5">
                    <Link
                      className="underline"
                      href={"/admin/orders/" + encodeURIComponent(o.order_ref)}
                    >
                      {o.order_ref}
                    </Link>
                    <p className="mt-1 text-xs text-black/50">
                      {new Date(o.created_at).toLocaleDateString("en-GB")}
                    </p>
                  </td>
                  <td className="p-5">
                    {o.customer_email || "Awaiting checkout"}
                  </td>
                  <td className="p-5">{o.status}</td>
                  <td className="p-5">
                    {o.printify_status || "Not submitted"}
                  </td>
                  <td className="p-5">
                    {new Intl.NumberFormat("en-GB", {
                      style: "currency",
                      currency: o.currency || "GBP",
                    }).format(o.total_gbp || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!result.data.length && <p className="p-8">No orders yet.</p>}
        </div>
      )}
    </>
  );
}
