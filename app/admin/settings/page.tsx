import { DispatchQueueButton } from "@/components/admin/DispatchQueueButton";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { NotificationSetup } from "@/components/admin/NotificationSetup";
export default async function Page() {
  const db = getSupabaseAdmin();
  const activity = db
    ? await db
        .from("notification_outbox")
        .select("id,title,status,last_error,created_at")
        .order("created_at", { ascending: false })
        .limit(20)
    : null;
  return (
    <>
      <h1 className="mb-8 font-serif text-4xl">Store settings</h1>
      <NotificationSetup />
      <section className="mt-8 rounded-3xl border border-black/10 p-8">
        <h2 className="font-serif text-2xl">Alert delivery</h2>
        <p className="mt-3 text-sm text-black/60">
          Recent delivery attempts, including any failures that need attention.
        </p>
        <DispatchQueueButton />
        <ul className="mt-5 space-y-4">
          {activity?.data?.map((n) => (
            <li key={n.id} className="border-t border-black/10 pt-4">
              <p>
                {n.title} · {n.status}
              </p>
              {n.last_error && (
                <p className="mt-1 text-sm text-amber-800">{n.last_error}</p>
              )}
            </li>
          ))}
        </ul>
        {activity?.error && (
          <p className="mt-4">Alert history is currently unavailable.</p>
        )}
      </section>
      <section className="mt-8 rounded-3xl border border-black/10 p-8">
        <h2 className="font-serif text-2xl">Order funding</h2>
        <p className="mt-4 max-w-2xl">
          Customer payments are collected by Stripe. Printify charges production
          and delivery separately. Payout settings are managed in Stripe; no
          bank or payout changes are made here.
        </p>
      </section>
    </>
  );
}
