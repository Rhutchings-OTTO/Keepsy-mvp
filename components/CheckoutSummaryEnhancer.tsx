"use client";

import Image from "next/image";
import { useState } from "react";

type CheckoutSummaryEnhancerProps = {
  productName: string;
  priceText: string;
  thumbnailSrc?: string | null;
};

const FAQS = [
  {
    q: "Shipping",
    a: "Shipping options are shown during checkout. Delivery windows vary by location and season.",
  },
  {
    q: "Print quality",
    a: "Designs are prepared for clear print output and previewed before payment.",
  },
  {
    q: "Refunds",
    a: "If there is an issue, contact support and we will review the order with you.",
  },
];

export default function CheckoutSummaryEnhancer({ productName, priceText, thumbnailSrc }: CheckoutSummaryEnhancerProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="space-y-3">
      <article className="rounded-2xl border border-charcoal/8 bg-white p-4 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.12)]">
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-cream/80">
            {thumbnailSrc ? (
              <Image src={thumbnailSrc} alt="Checkout preview" fill className="object-contain p-1.5" unoptimized />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-charcoal">{productName}</p>
            <p className="text-sm text-charcoal/70">{priceText}</p>
            <p className="text-xs text-charcoal/55">You can review before paying.</p>
            <p className="text-xs text-charcoal/55">Secure payment via Stripe.</p>
          </div>
        </div>
      </article>

      <article className="rounded-2xl border border-charcoal/8 bg-white p-4 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.12)]">
        <p className="mb-2 text-sm font-semibold text-charcoal">Need help?</p>
        <div className="space-y-2">
          {FAQS.map((item, index) => (
            <div key={item.q} className="rounded-xl border border-black/10">
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-charcoal"
                aria-expanded={openIndex === index}
                onClick={() => setOpenIndex((prev) => (prev === index ? null : index))}
              >
                {item.q}
                <span aria-hidden="true">{openIndex === index ? "−" : "+"}</span>
              </button>
              {openIndex === index ? <p className="px-3 pb-3 text-xs text-charcoal/55">{item.a}</p> : null}
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
