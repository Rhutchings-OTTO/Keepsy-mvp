"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/components/motion/Reveal";

type Testimonial = {
  name: string;
  age: number;
  quote: string;
};

const TESTIMONIALS: Testimonial[] = [
  { name: "Amelia", age: 34, quote: "I made a birthday card for my mum in under 10 minutes. She cried." },
  { name: "Noah", age: 29, quote: "The pet mug looked exactly like our dog. Perfect anniversary gift." },
  { name: "Olivia", age: 41, quote: "The flow is so easy even for non-tech family members." },
  { name: "Ethan", age: 37, quote: "Fast shipping and genuinely premium print quality." },
  { name: "Sophie", age: 32, quote: "I love the style presets; no prompt-writing stress." },
  { name: "Lucas", age: 45, quote: "Great customer support and a smooth reorder process." },
];

function StarRating({ count = 5 }: { count?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M7 1L8.54 5.19H13L9.47 7.81L10.9 12L7 9.44L3.1 12L4.53 7.81L1 5.19H5.46L7 1Z"
            fill="#C9A84C"
          />
        </svg>
      ))}
    </div>
  );
}

function InitialsAvatar({ name }: { name: string }) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
      style={{ backgroundColor: "var(--color-terracotta)" }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

export function TestimonialGrid() {
  return (
    <section id="reviews" className="mx-auto max-w-7xl px-4 py-14 sm:py-20 sm:px-6">
      <Reveal variant="fadeUp">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(45,41,38,0.40)" }}>
          Customer Stories
        </p>
        <h2 className="mt-2 font-serif text-3xl font-bold tracking-[-0.03em] text-charcoal sm:text-4xl">
          Loved by Gift-Givers
        </h2>
        <p className="mt-2 text-sm text-charcoal/55">Rated 4.8/5 by 2,400+ customers across the UK and US</p>
      </Reveal>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((t, idx) => (
          <Reveal key={`${t.name}-${idx}`} variant="fadeUp" delay={idx * 0.07}>
            <motion.article
              whileHover={{ borderColor: "rgba(196,113,74,0.4)" }}
              className="rounded-2xl border border-charcoal/8 bg-white p-6 transition-shadow hover:shadow-[0_12px_32px_-16px_rgba(45,41,38,0.12)]"
            >
              <StarRating />
              <p className="mt-4 font-serif text-base leading-relaxed text-charcoal/80">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-5 flex items-center gap-3 border-t border-charcoal/6 pt-4">
                <InitialsAvatar name={t.name} />
                <p className="text-sm font-semibold text-charcoal">
                  {t.name}, {t.age}
                </p>
              </div>
            </motion.article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
