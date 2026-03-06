"use client";

import { Star } from "lucide-react";

const REVIEWS = [
  { name: "Amelia", quote: "The print quality felt premium and personal." },
  { name: "Noah", quote: "Super easy to create, and the mockup looked spot on." },
  { name: "Grace", quote: "Perfect last-minute gift idea that still felt thoughtful." },
  { name: "Leo", quote: "Simple flow and beautiful output from my prompt." },
  { name: "Maya", quote: "Loved how quickly I could preview different products." },
  { name: "Ethan", quote: "Checkout felt safe and straightforward." },
];

export default function ReviewsMini() {
  return (
    <section
      aria-label="Example customer reviews"
      className="rounded-[1.5rem] border border-white/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(248,244,238,0.88))] p-4 shadow-warm-sm backdrop-blur-sm"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-charcoal/40">Example reviews</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {REVIEWS.map((review) => (
          <article
            key={review.name}
            className="rounded-xl border border-black/8 p-3"
            style={{ backgroundColor: "rgba(253,246,238,0.70)" }}
          >
            <div className="mb-1.5 flex items-center gap-0.5 text-gold">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={`${review.name}-${i}`} className="h-3 w-3 fill-current" aria-hidden="true" />
              ))}
            </div>
            <p className="text-sm leading-6 text-charcoal/80">&quot;{review.quote}&quot;</p>
            <p className="mt-1 text-xs text-charcoal/45">— {review.name}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
