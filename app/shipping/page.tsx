import Link from "next/link";

export const metadata = {
  title: "Shipping & Delivery",
  description: "Shipping times, cutoff dates, and delivery information for UK and US orders.",
};

export default function ShippingPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
      <Link
        href="/"
        className="mb-12 inline-flex items-center gap-2 text-sm font-semibold transition hover:opacity-70"
        style={{ color: "var(--color-terracotta)" }}
      >
        ← Back to Keepsy
      </Link>

      <div className="rounded-2xl border border-charcoal/8 bg-white p-8 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.12)] sm:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: "var(--color-terracotta)" }}>
          Fast & Reliable
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.03em] sm:text-5xl" style={{ color: "var(--color-charcoal)" }}>
          Shipping & Delivery
        </h1>
        <p className="mt-4 text-base leading-8" style={{ color: "rgba(45,41,38,0.65)" }}>
          Standard production is 2–4 business days. Your gift ships as soon as it&apos;s print-perfect.
        </p>

        <div className="mt-10 space-y-6 border-t pt-10" style={{ borderColor: "rgba(45,41,38,0.10)" }}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border p-5" style={{ borderColor: "rgba(45,41,38,0.10)", backgroundColor: "rgba(255,255,255,0.60)" }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--color-terracotta)" }}>🇬🇧 United Kingdom</p>
              <h2 className="mt-2 font-serif text-lg font-semibold" style={{ color: "var(--color-charcoal)" }}>UK Delivery</h2>
              <p className="mt-2 text-sm leading-7" style={{ color: "rgba(45,41,38,0.70)" }}>
                Typically <strong>2–3 business days</strong> after dispatch via Royal Mail or courier.
              </p>
            </div>
            <div className="rounded-2xl border p-5" style={{ borderColor: "rgba(45,41,38,0.10)", backgroundColor: "rgba(255,255,255,0.60)" }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--color-terracotta)" }}>🇺🇸 United States</p>
              <h2 className="mt-2 font-serif text-lg font-semibold" style={{ color: "var(--color-charcoal)" }}>US Delivery</h2>
              <p className="mt-2 text-sm leading-7" style={{ color: "rgba(45,41,38,0.70)" }}>
                Typically <strong>3–6 business days</strong> after dispatch via USPS or UPS.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border p-5" style={{ borderColor: "rgba(44,74,62,0.15)", backgroundColor: "rgba(44,74,62,0.04)" }}>
            <h2 className="font-serif text-base font-semibold" style={{ color: "var(--color-forest)" }}>Seasonal Cutoff Notice</h2>
            <p className="mt-2 text-sm leading-7" style={{ color: "rgba(44,74,62,0.85)" }}>
              For major holidays (Christmas, Valentine&apos;s Day, Mother&apos;s Day), place your order at least <strong>7 days before</strong> your gifting date to allow for production and delivery.
            </p>
          </div>

          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>Free Shipping</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              Free shipping on all orders over £75 (UK) or $75 (US). Standard shipping rates apply below that threshold and are calculated at checkout.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
