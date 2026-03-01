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
      <article className="rounded-2xl border border-[#E7DBCF] bg-white/90 p-4">
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-[#F6EFE7]">
            {thumbnailSrc ? (
              <Image src={thumbnailSrc} alt="Checkout preview" fill className="object-cover" unoptimized />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#4E3D2E]">{productName}</p>
            <p className="text-sm text-[#6E5A48]">{priceText}</p>
            <p className="text-xs text-[#7B6755]">You can review before paying.</p>
            <p className="text-xs text-[#7B6755]">Secure payment via Stripe.</p>
          </div>
        </div>
      </article>

      <article className="rounded-2xl border border-[#E7DBCF] bg-white/85 p-4">
        <p className="mb-2 text-sm font-semibold text-[#4E3D2E]">Need help?</p>
        <div className="space-y-2">
          {FAQS.map((item, index) => (
            <div key={item.q} className="rounded-xl border border-[#EDE1D4]">
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-[#594736]"
                aria-expanded={openIndex === index}
                onClick={() => setOpenIndex((prev) => (prev === index ? null : index))}
              >
                {item.q}
                <span aria-hidden="true">{openIndex === index ? "−" : "+"}</span>
              </button>
              {openIndex === index ? <p className="px-3 pb-3 text-xs text-[#7A6654]">{item.a}</p> : null}
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

