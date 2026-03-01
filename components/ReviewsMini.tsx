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
    <section aria-label="Example customer reviews" className="rounded-2xl border border-[#E8DDD2] bg-white/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#806B57]">Example reviews</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {REVIEWS.map((review) => (
          <article key={review.name} className="rounded-xl bg-[#FBF7F2] p-3">
            <div className="mb-1 flex items-center gap-1 text-[#A27A48]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={`${review.name}-${i}`} className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              ))}
            </div>
            <p className="text-sm text-[#564434]">&quot;{review.quote}&quot;</p>
            <p className="mt-1 text-xs text-[#8A7561]">— {review.name}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

