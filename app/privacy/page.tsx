import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Keepsy",
  description: "How Keepsy handles your personal data and uploaded photos.",
};

export default function PrivacyPage() {
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
          Your Privacy
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.03em] sm:text-5xl" style={{ color: "var(--color-charcoal)" }}>
          Privacy Policy
        </h1>
        <p className="mt-4 text-base leading-8" style={{ color: "rgba(45,41,38,0.65)" }}>
          We only process your uploaded photos and data to generate your requested designs and fulfil your orders.
        </p>

        <div className="mt-10 space-y-8 border-t pt-10" style={{ borderColor: "rgba(45,41,38,0.10)" }}>
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>What We Collect</h2>
            <ul className="mt-3 space-y-2 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              <li>• Photos and images you upload for design generation</li>
              <li>• Order and payment information (processed securely by Stripe)</li>
              <li>• Shipping address for fulfilment</li>
              <li>• Email address if provided for order updates</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>How We Use It</h2>
            <ul className="mt-3 space-y-2 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              <li>• Uploaded media is used solely for your order workflow</li>
              <li>• We do not sell, rent, or share your personal data with third parties for marketing</li>
              <li>• AI generation is powered by OpenAI; please review their privacy policy</li>
              <li>• Payments are handled by Stripe; your card details never touch our servers</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>Your Rights</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.75)" }}>
              You can request deletion of your data at any time via the Delete My Data option on the Create page, or by emailing us at privacy@keepsy.co. We will fulfil your request within 30 days.
            </p>
          </section>

          <section className="rounded-2xl border p-5" style={{ borderColor: "rgba(45,41,38,0.08)", backgroundColor: "rgba(255,255,255,0.50)" }}>
            <h2 className="font-serif text-base font-semibold" style={{ color: "var(--color-charcoal)" }}>Contact</h2>
            <p className="mt-2 text-sm leading-7" style={{ color: "rgba(45,41,38,0.70)" }}>
              For privacy concerns, contact us at{" "}
              <a href="mailto:privacy@keepsy.co" className="font-semibold underline underline-offset-2 hover:opacity-70" style={{ color: "var(--color-terracotta)" }}>
                privacy@keepsy.co
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
