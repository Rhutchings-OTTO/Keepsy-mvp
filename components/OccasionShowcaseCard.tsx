"use client";

import Image from "next/image";
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

// Map occasion IDs to warm lifestyle images
const OCCASION_IMAGES: Record<string, string> = {
  "mothers-day": "/images/refresh/occasion-mothers-day.webp",
  "birthday": "/images/refresh/occasion-birthday.webp",
  "birthdays": "/images/refresh/occasion-birthday.webp",
  "anniversary": "/images/refresh/occasion-anniversary.webp",
  "anniversaries": "/images/refresh/occasion-anniversary.webp",
  "christmas": "/images/refresh/occasion-christmas.webp",
  "thanksgiving": "/images/refresh/occasion-thanksgiving.webp",
  "fourth-of-july": "/images/refresh/occasion-fourth-of-july.webp",
  "pet-gifts": "/images/refresh/occasion-pet-gifts.webp",
  "sympathy": "/images/refresh/occasion-sympathy.webp",
  "friendship": "/images/refresh/occasion-friendship.webp",
  "just-because": "/images/refresh/occasion-just-because.webp",
  "graduation": "/images/refresh/occasion-graduation.webp",
  "fathers-day": "/images/refresh/occasion-fathers-day.webp",
  "valentines": "/images/refresh/occasion-valentines.webp",
};

const FALLBACK_IMAGE = "/images/refresh/occasion-birthday.webp";

export function OccasionShowcaseCard({
  href,
  title,
  description,
  urgency,
  visual,
  className = "",
}: OccasionShowcaseCardProps) {
  const imgSrc = OCCASION_IMAGES[visual.id] ?? FALLBACK_IMAGE;

  return (
    <a
      href={href}
      className={`group relative block overflow-hidden rounded-2xl ${className}`}
      style={{ aspectRatio: "3/4" }}
    >
      {/* Background lifestyle image */}
      <Image
        src={imgSrc}
        alt={title}
        fill
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent transition-all duration-500 group-hover:from-black/70" />

      {/* Chip — top left */}
      <div className="absolute left-4 top-4 z-10">
        <span className="rounded-sm bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-charcoal backdrop-blur-sm">
          {visual.chip}
        </span>
      </div>

      {/* Content — bottom of card */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-5">
        {urgency && (
          <div className="mb-2">
            <span
              className="inline-block rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: "var(--color-terracotta)" }}
            >
              {urgency}
            </span>
          </div>
        )}

        <h3 className="font-serif text-2xl font-bold leading-tight text-white">{title}</h3>

        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/65">
          {description}
        </p>

        <div className="mt-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/70 transition-colors group-hover:text-white">
          <span>Shop Now</span>
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </div>
      </div>
    </a>
  );
}
