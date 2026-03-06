import Link from "next/link";

export const metadata = {
  title: "Refund Policy | Keepsy",
  description: "Our refund and return policy for Keepsy custom printed gifts.",
};

export default function RefundsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
      <Link
        href="/"
        className="mb-12 inline-flex items-center gap-2 text-sm font-semibold transition hover:opacity-70"
        style={{ color: "var(--color-terracotta)" }}
      >
        ← Back to Keepsy
      </Link>

      <div className="rounded-[2rem] border border-white/65 bg-[linear-gradient(180deg,rgba(253,246,238,0.92),rgba(247,236,224,0.95))] p-8 shadow-warm-md backdrop-blur-xl sm:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: "var(--color-terracotta)" }}>
          Our Promise
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.03em] sm:text-5xl" style={{ color: "var(--color-charcoal)" }}>
          Refund Policy
        </h1>
        <p className="mt-4 text-base leading-8" style={{ color: "rgba(45,41,38,0.65)" }}>
          If your order arrives damaged, misprinted, or incorrect, we will make it right — no fuss.
        </p>

        <div className="mt-10 space-y-8 border-t pt-10" style={{ borderColor: "rgba(45,41,38,0.10)" }}>
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>When We Offer Refunds</h2>
            <ul className="mt-3 space-y-2 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              <li>• Item arrived damaged in transit</li>
              <li>• Significant misprint or quality defect</li>
              <li>• Wrong item received</li>
            </ul>
            <p className="mt-4 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              Contact us within <span className="font-semibold" style={{ color: "var(--color-charcoal)" }}>14 days</span> of delivery with photo evidence and we will replace or fully refund your order.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>Custom Items</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              Because each product is made-to-order with your unique AI-generated design, we cannot accept returns for change-of-mind. However, we stand firmly behind the print quality and will always resolve genuine defects.
            </p>
          </section>

          <section className="rounded-2xl border p-5" style={{ borderColor: "rgba(44,74,62,0.15)", backgroundColor: "rgba(44,74,62,0.04)" }}>
            <h2 className="font-serif text-base font-semibold" style={{ color: "var(--color-forest)" }}>Support Response</h2>
            <p className="mt-2 text-sm leading-7" style={{ color: "rgba(44,74,62,0.85)" }}>
              We typically respond within 24 hours. Email us at{" "}
              <a href="mailto:support@keepsy.co" className="font-semibold underline underline-offset-2" style={{ color: "var(--color-terracotta)" }}>
                support@keepsy.co
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
