import { OccasionTiles } from "@/components/OccasionTiles";
import { PromoBanner } from "@/components/PromoBanner";
import { Reveal } from "@/components/motion/Reveal";
import Link from "next/link";

export const metadata = {
  title: "Gift Ideas by Occasion",
  description: "Browse gift ideas by occasion — birthdays, anniversaries, holidays and more. Find the perfect personalised gift.",
};

export default function GiftIdeasPage() {
  return (
    <>
      <PromoBanner />

      {/* Hero — forest green full-bleed */}
      <section
        className="py-20 sm:py-28"
        style={{ backgroundColor: "var(--color-forest)" }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <Reveal variant="fadeUp">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/50">
                Shop by Occasion
              </p>
              <h1 className="mt-4 font-serif font-bold tracking-[-0.04em] text-white leading-none"
                style={{ fontSize: "clamp(2.8rem, 6vw, 5rem)" }}>
                The Perfect Gift<br />Starts Here.
              </h1>
              <p className="mt-6 max-w-md text-base leading-8 text-white/65">
                Every keepsake made for the moment that matters. Browse by occasion and find something they&apos;ll never forget.
              </p>
            </Reveal>

            <Reveal variant="fadeUp" delay={0.15}>
              <div className="flex gap-8 lg:flex-col lg:text-right">
                {[
                  { value: "Thousands", label: "Happy customers" },
                  { value: "★★★★★", label: "Top rated" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="font-serif text-3xl font-bold text-white">{stat.value}</p>
                    <p className="mt-1 text-sm text-white/50">{stat.label}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Occasion tiles grid */}
      <OccasionTiles />

      {/* How it works strip */}
      <section
        className="py-16 sm:py-20"
        style={{ backgroundColor: "#F5EDE0" }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal variant="fadeUp">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.22em]"
              style={{ color: "var(--color-terracotta)" }}
            >
              How It Works
            </p>
          </Reveal>

          <div className="mt-8 grid gap-0 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Choose your occasion",
                body: "Browse categories that match the moment — birthdays, anniversaries, holidays, and more.",
              },
              {
                step: "02",
                title: "We suggest a direction",
                body: "Our AI generates design suggestions tailored to the occasion and your personal touch.",
              },
              {
                step: "03",
                title: "Personalise and order",
                body: "Tweak it until it's perfect, then we print and ship it straight to your door.",
              },
            ].map((item, i) => (
              <Reveal key={item.step} variant="fadeUp" delay={i * 0.1}>
                <div className="border-b border-charcoal/10 py-8 sm:border-b-0 sm:border-r sm:px-8 first:pl-0 last:border-r-0 last:pr-0">
                  <span
                    className="font-serif text-4xl font-bold leading-none"
                    style={{ color: "rgba(196,113,74,0.25)" }}
                  >
                    {item.step}
                  </span>
                  <h3 className="mt-4 font-serif text-xl font-bold text-charcoal">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-charcoal/60">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section
        className="py-16 sm:py-20"
        style={{ backgroundColor: "var(--color-terracotta)" }}
      >
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Reveal variant="fadeUp">
            <h2 className="font-serif text-4xl font-bold tracking-[-0.03em] text-white sm:text-5xl">
              Not Sure Where to Start?
            </h2>
            <p className="mx-auto mt-4 max-w-sm text-base leading-7 text-white/70">
              Our AI will suggest the perfect design based on who you&apos;re gifting for.
            </p>
            <Link
              href="/create"
              className="mt-8 inline-flex min-h-[52px] items-center justify-center rounded-xl px-10 text-base font-semibold transition hover:opacity-90"
              style={{ backgroundColor: "var(--color-charcoal)", color: "white" }}
            >
              Start Creating →
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
