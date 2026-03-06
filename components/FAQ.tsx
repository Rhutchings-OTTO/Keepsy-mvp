"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";

const FAQS = [
  {
    q: "How fast can I make a gift?",
    a: "Most customers finish in under 10 minutes from upload to checkout.",
  },
  {
    q: "When will my order arrive?",
    a: "Typical dispatch is 2–4 business days. See full details on our shipping page.",
  },
  {
    q: "Can I request a refund?",
    a: "Yes. If your item arrives damaged or incorrect, we'll make it right.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <Reveal variant="fadeUp">
        <h2 className="font-serif text-3xl font-bold text-charcoal sm:text-4xl">FAQs</h2>
      </Reveal>
      <div className="mt-6 space-y-3">
        {FAQS.map((faq, i) => (
          <Reveal key={faq.q} variant="fadeUp" delay={i * 0.06}>
            <div className="overflow-hidden rounded-[1.5rem] border border-white/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,244,238,0.92))] shadow-warm-sm backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-5 text-left"
                aria-expanded={openIndex === i}
              >
                <span className="font-semibold text-charcoal">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className="shrink-0 text-charcoal/40 transition-transform duration-200"
                  style={{ transform: openIndex === i ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>
              {openIndex === i && (
                <div className="border-t border-black/8 px-6 pb-5 pt-4">
                  <p className="text-sm leading-7 text-charcoal/70">{faq.a}</p>
                </div>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
