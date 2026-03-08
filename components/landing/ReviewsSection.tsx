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

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

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

export function ReviewsSection() {
  return (
    <section
      className="py-20 sm:py-28"
      style={{ backgroundColor: "var(--color-charcoal)" }}
    >
      <div className={CONTAINER}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
            Customer Love
          </p>
          <h2 className="mt-3 font-serif text-4xl font-bold tracking-[-0.03em] text-white sm:text-5xl">
            What Our Customers Say
          </h2>
        </motion.div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.map((review, index) => (
            <motion.div
              key={review.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
              className="flex flex-col rounded-2xl border border-white/8 bg-white/5 p-6"
            >
              {/* Stars */}
              <span className="text-sm" style={{ color: "var(--color-gold)" }}>★★★★★</span>

              {/* Big quotation mark */}
              <div
                className="mt-2 font-serif text-6xl font-bold leading-none"
                style={{ color: "rgba(196,113,74,0.35)" }}
              >
                &ldquo;
              </div>

              {/* Quote */}
              <p className="mt-1 flex-1 text-[15px] leading-7 text-white/75">
                {review.quote}
              </p>

              {/* Attribution */}
              <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{ backgroundColor: "rgba(196,113,74,0.2)", color: "var(--color-terra-light)" }}
                >
                  {review.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {review.name}, {review.state}
                  </p>
                  <p className="text-xs text-white/40">{review.occasion}</p>
                </div>
              </div>
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
            className="inline-flex items-center gap-2 rounded-xl border border-white/65 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20 hover:border-white"
            style={{ color: "white" }}
          >
            Read all stories <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
