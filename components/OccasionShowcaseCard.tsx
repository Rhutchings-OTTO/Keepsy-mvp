"use client";

import Image from "next/image";
import { MockupStage } from "@/components/mockups/MockupStage";
import type { OccasionId } from "@/lib/siteConfig";
import type { MockupColor, MockupProductType } from "@/lib/mockups/placements";

type OccasionShowcaseCardProps = {
  href: string;
  title: string;
  description: string;
  urgency?: string | null;
  visual: {
    id: OccasionId;
    chip: string;
    accent: string;
    artworkImage: string;
    productType: MockupProductType;
    color: MockupColor;
  };
  className?: string;
};

export function OccasionShowcaseCard({
  href,
  title,
  description,
  urgency,
  visual,
  className = "",
}: OccasionShowcaseCardProps) {
  return (
    <a
      href={href}
      className={`group block rounded-[2rem] border border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,243,238,0.96))] p-3 shadow-[0_24px_52px_-34px_rgba(23,18,12,0.34)] transition-transform duration-300 hover:-translate-y-1 ${className}`}
    >
      <div
        className="relative overflow-hidden rounded-[1.5rem] border border-black/8 p-3"
        style={{ background: visual.accent }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.95),transparent_34%),radial-gradient(circle_at_82%_20%,rgba(255,255,255,0.55),transparent_28%)]" />
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="max-w-[8rem]">
            <p className="inline-flex rounded-full bg-black/75 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
              {visual.chip}
            </p>
            <p className="mt-3 text-xs leading-5 text-black/60">
              Real artwork preview on the final product.
            </p>
          </div>
          <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-white/70 bg-white/70 shadow-sm">
            <Image
              src={visual.artworkImage}
              alt={`${title} artwork`}
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>
        </div>
        <div className="relative z-10 mt-4">
          <MockupStage
            productType={visual.productType}
            color={visual.color}
            generatedImage={visual.artworkImage}
            className="!rounded-[1.5rem] !border-white/60 !bg-white/55"
          />
        </div>
      </div>
      <div className="px-1 pb-1 pt-4">
        <h3 className="text-lg font-bold text-charcoal">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-black/60">{description}</p>
        {urgency ? (
          <p className="mt-3 rounded-xl px-3 py-2 text-xs font-semibold text-terracotta" style={{ backgroundColor: "rgba(196,113,74,0.10)" }}>
            {urgency}
          </p>
        ) : null}
      </div>
    </a>
  );
}
