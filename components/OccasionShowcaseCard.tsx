"use client";

import Image from "next/image";
import Link from "next/link";
import type { OccasionId } from "@/lib/siteConfig";
import type { MockupColor, MockupProductType } from "@/lib/mockups/placements";

type OccasionShowcaseCardProps = {
  href: string;
  title: string;
  description: string;
  /** Kept for compatibility; urgency chips are no longer rendered. */
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

const OCCASION_IMAGES: Record<string, string> = {
  "mothers-day": "/images/refresh/occasion-mothers-day.webp",
  birthday: "/images/refresh/occasion-birthday.webp",
  birthdays: "/images/refresh/occasion-birthday.webp",
  anniversary: "/images/refresh/occasion-anniversary.webp",
  anniversaries: "/images/refresh/occasion-anniversary.webp",
  christmas: "/images/refresh/occasion-christmas.webp",
  thanksgiving: "/images/refresh/occasion-thanksgiving.webp",
  "fourth-of-july": "/images/refresh/occasion-fourth-of-july.webp",
  "pet-gifts": "/images/refresh/occasion-pet-gifts.webp",
  sympathy: "/images/refresh/occasion-sympathy.webp",
  friendship: "/images/refresh/occasion-friendship.webp",
  "just-because": "/images/refresh/occasion-just-because.webp",
  graduation: "/images/refresh/occasion-graduation.webp",
  "fathers-day": "/images/refresh/occasion-fathers-day.webp",
  valentines: "/images/refresh/occasion-valentines.webp",
};

const FALLBACK_IMAGE = "/images/refresh/occasion-birthday.webp";

export function OccasionShowcaseCard({
  href,
  title,
  description,
  visual,
  className = "",
}: OccasionShowcaseCardProps) {
  const imgSrc = OCCASION_IMAGES[visual.id] ?? FALLBACK_IMAGE;

  return (
    <Link
      href={href}
      className={`group flex h-full flex-col overflow-hidden rounded-3xl border border-charcoal/8 bg-white transition hover:border-charcoal/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40 ${className}`}
    >
      <div className="relative bg-[#F5EDE0]" style={{ aspectRatio: "4 / 3" }}>
        <Image
          src={imgSrc}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-charcoal/45">
          {visual.chip}
        </p>
        <h3 className="mt-1.5 font-serif text-2xl font-bold leading-tight tracking-tight text-charcoal">
          {title}
        </h3>
        <p className="mt-1.5 text-sm leading-6 text-charcoal/65">
          {description}
        </p>
        <p
          className="mt-auto pt-4 text-sm font-semibold"
          style={{ color: "var(--color-terracotta)" }}
        >
          Start with this <span aria-hidden>→</span>
        </p>
      </div>
    </Link>
  );
}
