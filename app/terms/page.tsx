import Link from "next/link";

export const metadata = {
  title: "Terms of Artistry | Keepsy",
  description:
    "Our Manifesto of Quality — the fine print that frames every Keepsy creation.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-ivory">
      <div className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
        <Link
          href="/"
          className="mb-12 inline-flex items-center gap-2 text-sm font-semibold text-black/55 hover:text-black"
        >
          ← Back to Keepsy
        </Link>
        <header className="mb-16">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-black/40">
            The Fine Print
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-obsidian sm:text-5xl">
            Terms of Artistry
          </h1>
          <p className="mt-4 text-lg text-black/60">
            A Manifesto of Quality. We reframe AI unpredictability as a bespoke feature,
            not a tech limitation.
          </p>
        </header>

        <div className="space-y-12 border-t border-black/10 pt-12">
          <section>
            <h2 className="font-serif text-xl font-bold text-obsidian">
              The Uniqueness Clause
            </h2>
            <p className="mt-3 leading-relaxed text-black/75">
              As every design is generated in real-time by our neural engine, no two
              physical artifacts are identical. Your piece is a{" "}
              <span className="font-semibold text-obsidian">1-of-1 digital original</span>.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-obsidian">
              The Material Guarantee
            </h2>
            <p className="mt-3 leading-relaxed text-black/75">
              We utilize only museum-grade inks and organic heavy-weight textiles. Our
              ceramics are kiln-fired to ensure your imagination lasts a lifetime.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-obsidian">
              The Atelier Process
            </h2>
            <p className="mt-3 leading-relaxed text-black/75">
              Once your order is confirmed, it enters our physical atelier. Because of the
              bespoke nature of generative printing, please allow our artisans{" "}
              <span className="font-semibold text-obsidian">48 hours</span> to calibrate
              the colors to your specific prompt.
            </p>
          </section>

          <section className="rounded-2xl border border-black/[0.08] bg-white/50 p-6">
            <h2 className="font-serif text-lg font-bold text-obsidian">
              Usage & Intellectual Property
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-black/70">
              By placing an order you confirm that you have rights to uploaded images and
              content. Do not upload illegal, unsafe, or copyrighted material. Keepsy may
              refuse requests that violate policy. Payment is processed securely by Stripe.
              Refunds are offered for damaged or defective items.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
