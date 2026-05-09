"use client";

// ReviewsSection — extracted from LandingPage (Phase 3 fix 3.7).
//
// This section has no dependency on region, gateway state, or any shared
// LandingPage state. It's extracted here so it can be lazy-loaded with
// next/dynamic, deferring the Framer Motion whileInView animations and
// review card markup until after the critical above-the-fold content paints.
//
// Note: this component must remain "use client" because it uses Framer Motion
// (whileInView, motion.div). A future migration to CSS scroll-driven animations
// would allow converting this to a Server Component.

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";

const CONTAINER = "mx-auto w-full max-w-6xl px-5 sm:px-8";

const REVIEWS = [
  {
    quote:
      "I ordered the custom mug with my daughter's artwork on it for my mom's 70th birthday. She cried. Literally cried. The quality is incredible — it feels expensive and the print is crystal clear.",
    name: "Sarah M.",
    state: "Ohio",
    occasion: "Birthday Gift",
  },
  {
    quote:
      "Got the personalised hoodie for my best friend for Mother's Day and she texted me at 7am when she opened it. She said it was the most thoughtful gift she'd ever received. I'll definitely be ordering again.",
    name: "Jennifer K.",
    state: "Texas",
    occasion: "Mother's Day",
  },
  {
    quote:
      "My husband passed away last year and I had a photo card made of our favourite family memory for Christmas. Every one of my kids got one. It was the most meaningful thing I've ever given.",
    name: "Diane R.",
    state: "Colorado",
    occasion: "Memorial Gift",
  },
  {
    quote:
      "Ordered the custom tee for my sister's anniversary trip. The colours are so vibrant and the quality is incredible. Felt like I'd spent twice what I did. Absolute steal.",
    name: "Michelle T.",
    state: "Florida",
    occasion: "Anniversary",
  },
  {
    quote:
      "I am NOT a tech person but this was so easy. I uploaded a photo of my granddaughter and had a mug ordered in literally ten minutes. My daughter loved it for Christmas.",
    name: "Carol B.",
    state: "Virginia",
    occasion: "Christmas Gift",
  },
  {
    quote:
      "Bought the photo card pack just because I wanted to do something special, no occasion. My best friend called me sobbing. The photo quality is gorgeous — not like a drugstore print at all.",
    name: "Lisa H.",
    state: "California",
    occasion: "Just Because",
  },
];

function StarRating() {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          fill="currentColor"
          strokeWidth={0}
          style={{ color: "var(--color-gold, #C9A84C)" }}
        />
      ))}
    </span>
  );
}

function ReviewCard({ review, className }: { review: (typeof REVIEWS)[number]; className?: string }) {
  return (
    <div
      className={`flex flex-col rounded-2xl border border-charcoal/8 p-6 ${className ?? ""}`}
      style={{ backgroundColor: "var(--color-cream-dark)" }}
    >
      {/* Stars */}
      <StarRating />

      {/* Big quotation mark */}
      <div
        className="mt-2 font-serif text-6xl font-bold leading-none"
        style={{ color: "rgba(196,113,74,0.4)" }}
      >
        &ldquo;
      </div>

      {/* Quote */}
      <p className="mt-1 flex-1 text-[15px] leading-7 text-charcoal/75">
        {review.quote}
      </p>

      {/* Attribution */}
      <div className="mt-5 flex items-center gap-3 border-t border-charcoal/10 pt-4">
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
          style={{ backgroundColor: "rgba(196,113,74,0.15)", color: "var(--color-terracotta)" }}
        >
          {review.name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold text-charcoal">
            {review.name}, {review.state}
          </p>
          <p className="text-xs text-charcoal/45">{review.occasion}</p>
        </div>
      </div>
    </div>
  );
}

function MobileCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Each card is ~85vw + gap. Determine which card is most visible.
    const cardWidth = el.scrollWidth / REVIEWS.length;
    const index = Math.round(el.scrollLeft / cardWidth);
    setActiveIndex(Math.min(index, REVIEWS.length - 1));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div>
      <div
        ref={scrollRef}
        className="scrollbar-hide flex gap-4 overflow-x-auto px-5"
        style={{
          scrollSnapType: "x mandatory",
          // Match px-5 (1.25rem) so cards 2+ snap with the same left
          // breathing room as card 1, not flush against the viewport edge.
          scrollPaddingInlineStart: "1.25rem",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {REVIEWS.map((review) => (
          <div
            key={review.name}
            className="w-[85vw] flex-shrink-0"
            style={{ scrollSnapAlign: "start" }}
          >
            <ReviewCard review={review} className="h-full" />
          </div>
        ))}
        {/* End spacer so last card can snap to start */}
        <div className="w-1 flex-shrink-0" />
      </div>

      {/* Dot indicators */}
      <div className="mt-5 flex justify-center gap-2">
        {REVIEWS.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to review ${i + 1}`}
            onClick={() => {
              const el = scrollRef.current;
              if (!el) return;
              const cardWidth = el.scrollWidth / REVIEWS.length;
              el.scrollTo({ left: cardWidth * i, behavior: "smooth" });
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === activeIndex
                ? "w-5 bg-charcoal/55"
                : "w-2 bg-charcoal/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function ReviewsSection() {
  return (
    <section
      className="py-12 sm:py-20"
      style={{ backgroundColor: "var(--color-cream)" }}
    >
      <div className={CONTAINER}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <p
            className="text-[11px] font-bold uppercase tracking-[0.22em]"
            style={{ color: "var(--color-terracotta)" }}
          >
            Customer Love
          </p>
          <h2 className="mt-3 font-serif text-3xl font-bold tracking-[-0.03em] text-charcoal sm:text-5xl">
            What Our Customers Say
          </h2>
        </motion.div>
      </div>

      {/* Mobile: swipeable carousel (below md) */}
      <div className="mt-8 md:hidden">
        <MobileCarousel />
      </div>

      {/* Desktop: grid layout (md+) */}
      <div className={CONTAINER}>
        <div className="mt-8 hidden gap-6 sm:mt-14 md:grid md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {REVIEWS.map((review, index) => (
            <motion.div
              key={review.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
            >
              <ReviewCard review={review} className="h-full" />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 text-center"
        >
          <Link
            href="/community"
            className="inline-flex items-center gap-2 rounded-xl border-2 px-6 py-3 text-sm font-semibold text-charcoal transition hover:-translate-y-0.5"
            style={{ borderColor: "var(--color-charcoal)" }}
          >
            Read all stories <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
