import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Keepsy",
  description: "Our terms of service — the fine print that frames every Keepsy creation.",
};

export default function TermsPage() {
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
          The Fine Print
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.03em] sm:text-5xl" style={{ color: "var(--color-charcoal)" }}>
          Terms of Artistry
        </h1>
        <p className="mt-4 text-lg leading-8" style={{ color: "rgba(45,41,38,0.65)" }}>
          A Manifesto of Quality. We reframe AI unpredictability as a bespoke feature, not a tech limitation.
        </p>

        <div className="mt-10 space-y-10 border-t pt-10" style={{ borderColor: "rgba(45,41,38,0.10)" }}>
          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>The Uniqueness Clause</h2>
            <p className="mt-3 leading-relaxed" style={{ color: "rgba(45,41,38,0.75)" }}>
              As every design is generated in real-time by our neural engine, no two physical artifacts are identical. Your piece is a{" "}
              <span className="font-semibold" style={{ color: "var(--color-charcoal)" }}>1-of-1 digital original</span>.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>The Material Guarantee</h2>
            <p className="mt-3 leading-relaxed" style={{ color: "rgba(45,41,38,0.75)" }}>
              We utilize only museum-grade inks and organic heavy-weight textiles. Our ceramics are kiln-fired to ensure your imagination lasts a lifetime.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--color-charcoal)" }}>The Atelier Process</h2>
            <p className="mt-3 leading-relaxed" style={{ color: "rgba(45,41,38,0.75)" }}>
              Once your order is confirmed, it enters our physical atelier. Because of the bespoke nature of generative printing, please allow our artisans{" "}
              <span className="font-semibold" style={{ color: "var(--color-charcoal)" }}>48 hours</span> to calibrate the colors to your specific prompt.
            </p>
          </section>

          <section className="rounded-2xl border p-6" style={{ borderColor: "rgba(45,41,38,0.08)", backgroundColor: "rgba(255,255,255,0.50)" }}>
            <h2 className="font-serif text-lg font-semibold" style={{ color: "var(--color-charcoal)" }}>Usage & Intellectual Property</h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "rgba(45,41,38,0.70)" }}>
              By placing an order you confirm that you have rights to uploaded images and content. Do not upload illegal, unsafe, or copyrighted material. Keepsy may refuse requests that violate policy. Payment is processed securely by Stripe. Refunds are offered for damaged or defective items.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
