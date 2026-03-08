import Link from "next/link";

export const metadata = {
  title: "Refund & Returns Policy",
  description: "Our refund and returns policy, including your statutory rights as a UK consumer.",
};

const LAST_UPDATED = "8 March 2026";

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

      <div className="rounded-2xl border border-charcoal/8 bg-white p-8 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.12)] sm:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: "var(--color-terracotta)" }}>
          Our Promise
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.03em] sm:text-5xl" style={{ color: "var(--color-charcoal)" }}>
          Refund &amp; Returns Policy
        </h1>
        <p className="mt-2 text-xs" style={{ color: "rgba(45,41,38,0.45)" }}>
          Last updated: {LAST_UPDATED}
        </p>
        <p className="mt-4 text-base leading-8" style={{ color: "rgba(45,41,38,0.65)" }}>
          We want you to be completely happy with your Keepsy order. This page explains your statutory rights and our returns process.
        </p>

        <div className="mt-10 space-y-10 border-t pt-10" style={{ borderColor: "rgba(45,41,38,0.10)" }}>

          {/* Statutory Rights */}
          <section className="rounded-2xl border p-6" style={{ borderColor: "rgba(44,74,62,0.20)", backgroundColor: "rgba(44,74,62,0.04)" }}>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-forest)" }}>Your Statutory Rights</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(44,74,62,0.85)" }}>
              Under the <strong>Consumer Rights Act 2015</strong>, all goods must be of satisfactory quality, fit for purpose, and as described. If your order does not meet these standards, you have the right to a repair, replacement, or refund.
            </p>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(44,74,62,0.85)" }}>
              <strong>These statutory rights are not affected by our policies below.</strong> Nothing on this page limits your legal rights as a consumer.
            </p>
          </section>

          {/* Personalised Goods — Cancellation Right */}
          <section className="rounded-2xl border p-6" style={{ borderColor: "rgba(196,113,74,0.25)", backgroundColor: "rgba(196,113,74,0.04)" }}>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>Right to Cancel — Personalised Goods</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              Under the Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013, consumers who buy goods online generally have a <strong>14-day right to cancel</strong> their order and receive a full refund without giving a reason.
            </p>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              However, this right to cancel does <strong>not apply</strong> to goods that are &quot;made to the consumer&apos;s specifications or are clearly personalised&quot; (Regulation 28(1)(b)). All Keepsy products are made individually to your specifications — including your uploaded photo, custom AI-generated design, chosen colour, and size. Once production begins, we are unable to cancel your order or accept a return for &quot;change of mind.&quot;
            </p>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              <strong>Important:</strong> We bring this exception to your attention before you complete your order, as required by Regulation 28(3) of the Regulations. By confirming your purchase, you acknowledge that the cancellation right does not apply.
            </p>
          </section>

          {/* When We Offer Refunds */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>When We Will Refund or Replace Your Order</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              Even though the 14-day cancellation right does not apply to personalised goods, we will always make things right if there is a problem with your order. We offer a full refund or replacement in the following circumstances:
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              <li>• Item arrived damaged in transit</li>
              <li>• Significant misprint, print defect, or quality issue</li>
              <li>• Wrong item or specification received (wrong size, colour, or design)</li>
              <li>• Item not delivered within a reasonable timeframe</li>
            </ul>
            <p className="mt-4 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              Please contact us within <strong style={{ color: "var(--color-charcoal)" }}>30 days of delivery</strong> with photo evidence of the issue and your order number.
            </p>
          </section>

          {/* How to Claim */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>How to Request a Refund or Replacement</h2>
            <ol className="mt-3 space-y-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              <li>
                <span className="font-semibold" style={{ color: "var(--color-charcoal)" }}>1. Email us</span> at{" "}
                <a href="mailto:support@keepsy.store" className="underline underline-offset-2" style={{ color: "var(--color-terracotta)" }}>
                  support@keepsy.store
                </a>{" "}
                with the subject line &quot;Refund Request — [Order Number].&quot;
              </li>
              <li>
                <span className="font-semibold" style={{ color: "var(--color-charcoal)" }}>2. Include:</span> your order number, a clear description of the issue, and photographs showing the defect or damage.
              </li>
              <li>
                <span className="font-semibold" style={{ color: "var(--color-charcoal)" }}>3. We will respond</span> within 2 business days with a resolution — either a replacement order or a refund.
              </li>
              <li>
                <span className="font-semibold" style={{ color: "var(--color-charcoal)" }}>4. Refunds</span> are issued to your original payment method within <strong>14 days</strong> of us agreeing to refund you. You do not need to return a defective item unless we specifically request it.
              </li>
            </ol>
          </section>

          {/* Return Shipping */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>Return Shipping</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              For defective or incorrect items, we will cover the cost of return shipping or arrange a pre-paid return label. We will not ask you to return items at your own expense where the fault is ours.
            </p>
          </section>

          {/* Outside UK */}
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>International Orders (US Customers)</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              US customers have equivalent protections under US consumer protection law. Our refund process above applies equally to US orders. Please contact us at{" "}
              <a href="mailto:support@keepsy.store" className="underline underline-offset-2" style={{ color: "var(--color-terracotta)" }}>
                support@keepsy.store
              </a>{" "}
              for assistance.
            </p>
          </section>

          {/* Support */}
          <section className="rounded-2xl border p-5" style={{ borderColor: "rgba(44,74,62,0.15)", backgroundColor: "rgba(44,74,62,0.04)" }}>
            <h2 className="font-serif text-base font-semibold" style={{ color: "var(--color-forest)" }}>Customer Support</h2>
            <p className="mt-2 text-sm leading-7" style={{ color: "rgba(44,74,62,0.85)" }}>
              We typically respond within 24 hours, 7 days a week. Email us at{" "}
              <a href="mailto:support@keepsy.store" className="font-semibold underline underline-offset-2" style={{ color: "var(--color-terracotta)" }}>
                support@keepsy.store
              </a>
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
