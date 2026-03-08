import { TestimonialGrid } from "@/components/TestimonialGrid";
import { Reveal } from "@/components/motion/Reveal";
import Link from "next/link";

export const metadata = {
  title: "Customer Reviews",
  description: "See what customers are saying about Keepsy personalised gifts. Loved by customers across the UK and US.",
};

const PULL_QUOTES = [
  {
    quote: "She cried. Genuinely the most personal gift I've ever given.",
    name: "Amelia R.",
    occasion: "Birthday Card",
  },
  {
    quote: "Our dog is on a mug. That's it. That's the review.",
    name: "Noah T.",
    occasion: "Pet Portrait Mug",
  },
  {
    quote: "Ordered Thursday, arrived Saturday. Beautiful quality too.",
    name: "Sophie M.",
    occasion: "Anniversary Print",
  },
];

export default function CommunityPage() {
  return (
    <>
      {/* Hero — terracotta full-bleed */}
      <section
        className="py-20 sm:py-28"
        style={{ backgroundColor: "var(--color-terracotta)" }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <Reveal variant="fadeUp">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/50">
                Customer Reviews
              </p>
              <h1
                className="mt-4 font-serif font-bold tracking-[-0.04em] text-white leading-none"
                style={{ fontSize: "clamp(2.8rem, 6vw, 5rem)" }}
              >
                Real Gifts.<br />Real Reactions.
              </h1>
              <p className="mt-6 max-w-md text-base leading-8 text-white/65">
                Every review below is from a real Keepsy customer. No scripts, no filters — just honest words from people who found the perfect gift.
              </p>
            </Reveal>

            <Reveal variant="fadeUp" delay={0.15}>
              <div className="flex gap-8 lg:flex-col lg:text-right">
                {[
                  { value: "★★★★★", label: "Top rated" },
                  { value: "Hundreds", label: "Verified reviews" },
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

      {/* Pull-quote trio — cream background */}
      <section className="py-16 sm:py-20" style={{ backgroundColor: "var(--color-cream)" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-0 sm:grid-cols-3">
            {PULL_QUOTES.map((item, i) => (
              <Reveal key={item.name} variant="fadeUp" delay={i * 0.1}>
                <div className="border-b border-charcoal/10 py-8 sm:border-b-0 sm:border-r sm:px-8 first:pl-0 last:border-r-0 last:pr-0">
                  <span
                    className="font-serif text-6xl font-bold leading-none select-none"
                    style={{ color: "rgba(196,113,74,0.20)" }}
                    aria-hidden="true"
                  >
                    &ldquo;
                  </span>
                  <p className="mt-1 font-serif text-lg font-bold leading-snug text-charcoal">
                    {item.quote}
                  </p>
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-charcoal">{item.name}</p>
                    <p className="text-xs text-charcoal/50">{item.occasion}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Full review grid */}
      <div style={{ backgroundColor: "#F5EDE0" }}>
        <TestimonialGrid />
      </div>

      {/* Share Your Story CTA — forest green */}
      <section
        className="py-16 sm:py-20"
        style={{ backgroundColor: "var(--color-forest)" }}
      >
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Reveal variant="fadeUp">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/50">
              Share Your Story
            </p>
            <h2 className="mt-4 font-serif text-4xl font-bold tracking-[-0.03em] text-white sm:text-5xl">
              Made Something Special?
            </h2>
            <p className="mx-auto mt-4 max-w-sm text-base leading-7 text-white/65">
              We&apos;d love to hear about it. Tag us on Instagram or leave a review and inspire the next gift-giver.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/create"
                className="inline-flex min-h-[52px] items-center justify-center rounded-xl px-10 text-base font-semibold transition hover:opacity-90"
                style={{ backgroundColor: "var(--color-terracotta)", color: "white" }}
              >
                Start Creating →
              </Link>
              <Link
                href="/shop"
                className="inline-flex min-h-[52px] items-center justify-center rounded-xl border-2 border-white bg-white/10 px-10 text-base font-semibold text-white transition hover:bg-white/20"
              >
                Browse Shop
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
