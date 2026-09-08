import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { ACCOUNT_PATHS, isSupabaseAuthConfigured } from "@/lib/supabase/config";
import { AccountNotConfigured } from "@/components/account/AccountShell";
import { SignOutButton } from "@/components/account/AuthForms";
import { SavedDesignsGrid, type SavedDesign } from "@/components/account/SavedDesignsGrid";
import { formatMoney, type Currency } from "@/lib/commerce/pricing";
import { refreshSignedUrl } from "@/lib/storage/supabaseStorage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Account",
  description: "Your saved designs and order history.",
  robots: { index: false, follow: false },
};

type OrderRow = {
  order_ref: string;
  status: string;
  currency: string | null;
  total_gbp: number | string | null;
  created_at: string;
  generated_image_url: string | null;
  tracking_url: string | null;
  printify_status: string | null;
  order_items: Array<{ product_name: string; quantity: number; size: string | null; color: string | null }> | null;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting payment",
  paid: "Confirmed",
  in_production: "In production",
  shipped: "Shipped",
  delivered: "Delivered",
  failed: "Payment issue",
  cancelled: "Cancelled",
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function AccountPage() {
  if (!isSupabaseAuthConfigured()) return <AccountNotConfigured />;

  const supabase = await createServerSupabase();
  const { data: userData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const user = userData.user;
  if (!supabase || !user) redirect(`${ACCOUNT_PATHS.signIn}?next=${encodeURIComponent(ACCOUNT_PATHS.home)}`);

  // Both queries run as the signed-in user; RLS limits rows to user_id = auth.uid().
  const [ordersRes, designsRes] = await Promise.all([
    supabase
      .from("orders")
      .select("order_ref, status, currency, total_gbp, created_at, generated_image_url, tracking_url, printify_status, order_items(product_name, quantity, size, color)")
      .neq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("saved_designs")
      .select("id, image_url, design_url, prompt, source_kind, created_at")
      .order("created_at", { ascending: false })
      .limit(60),
  ]);

  // Private-bucket images are served through signed URLs that expire; re-sign for display.
  const orders = await Promise.all(
    ((ordersRes.data ?? []) as OrderRow[]).map(async (o) => ({ ...o, generated_image_url: await refreshSignedUrl(o.generated_image_url) }))
  );
  const designs = await Promise.all(
    ((designsRes.data ?? []) as SavedDesign[]).map(async (d) => ({
      ...d,
      image_url: (await refreshSignedUrl(d.image_url)) ?? d.image_url,
      design_url: await refreshSignedUrl(d.design_url),
    }))
  );
  const loadError = ordersRes.error || designsRes.error;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-charcoal/8 bg-white p-8 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.12)] sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--color-terracotta)" }}>Account</p>
            <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.04em] sm:text-5xl" style={{ color: "var(--color-charcoal)" }}>
              Welcome back.
            </h1>
            <p className="mt-3 text-base leading-7" style={{ color: "rgba(45,41,38,0.65)" }}>
              Signed in as <span className="font-semibold text-charcoal">{user.email}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/create"
              className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: "var(--color-terracotta)" }}
            >
              Create a new gift
            </Link>
            <SignOutButton />
          </div>
        </div>
        {loadError ? (
          <p role="alert" className="mt-6 rounded-xl px-4 py-3 text-sm font-semibold" style={{ backgroundColor: "rgba(196,113,74,0.10)", color: "var(--color-terra-dark)" }}>
            We couldn&apos;t load part of your account just now. Refresh to try again.
          </p>
        ) : null}
      </div>

      {/* Orders */}
      <section className="mt-8 rounded-2xl border border-charcoal/8 bg-white p-6 shadow-[0_8px_24px_-12px_rgba(45,41,38,0.10)] sm:p-8">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-2xl font-bold tracking-[-0.03em] text-charcoal">Your orders</h2>
          <span className="text-xs font-semibold text-charcoal/45">{orders.length} {orders.length === 1 ? "order" : "orders"}</span>
        </div>
        {orders.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-charcoal/15 bg-[#FDF6EE] p-8 text-center">
            <p className="font-semibold text-charcoal">No orders yet</p>
            <p className="mt-1 text-sm text-charcoal/60">
              Orders you place while signed in will show up here. Guest orders can be tracked from the link in your confirmation email.
            </p>
          </div>
        ) : (
          <ul className="mt-5 divide-y divide-charcoal/8">
            {orders.map((o) => {
              const currency: Currency = o.currency === "usd" ? "usd" : "gbp";
              const items = o.order_items ?? [];
              return (
                <li key={o.order_ref} className="flex flex-wrap items-center gap-4 py-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-charcoal/10 bg-[#F5EDE0]">
                    {o.generated_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={o.generated_image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-charcoal">
                      {items.map((i) => `${i.product_name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", ") || "Keepsy order"}
                    </p>
                    <p className="mt-0.5 text-xs text-charcoal/55">
                      {formatDate(o.created_at)} · <span className="font-mono">{o.order_ref}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-charcoal">{formatMoney(Number(o.total_gbp ?? 0), currency)}</p>
                    <p className="text-xs font-semibold" style={{ color: o.status === "failed" || o.status === "cancelled" ? "var(--color-terra-dark)" : "var(--color-forest)" }}>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </p>
                  </div>
                  <Link
                    href={`/track?ref=${encodeURIComponent(o.order_ref)}`}
                    className="inline-flex h-9 items-center rounded-lg border border-charcoal/15 px-3 text-xs font-bold text-charcoal transition hover:bg-charcoal/5"
                  >
                    Track
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Saved designs */}
      <section className="mt-8 rounded-2xl border border-charcoal/8 bg-white p-6 shadow-[0_8px_24px_-12px_rgba(45,41,38,0.10)] sm:p-8">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-2xl font-bold tracking-[-0.03em] text-charcoal">Saved designs</h2>
          <span className="text-xs font-semibold text-charcoal/45">{designs.length} saved</span>
        </div>
        <div className="mt-5">
          <SavedDesignsGrid initialDesigns={designs} />
        </div>
      </section>
    </main>
  );
}
