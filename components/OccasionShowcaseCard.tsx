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
  "mothers-day": "/images/occasions/mothers-day.jpg",
  "birthday": "/images/occasions/birthday.jpg",
  "birthdays": "/images/occasions/birthday.jpg",
  "anniversary": "/images/occasions/anniversary.jpg",
  "anniversaries": "/images/occasions/anniversary.jpg",
  "christmas": "/images/occasions/christmas.jpg",
  "thanksgiving": "/images/occasions/thanksgiving.jpg",
  "fourth-of-july": "/images/occasions/fourth-of-july.jpg",
  "pet-gifts": "/images/occasions/pet-gifts.jpg",
  "sympathy": "https://images.unsplash.com/photo-1490750967868-88df5691cc2c?w=600",
  "friendship": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600",
  "just-because": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600",
  "graduation": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600",
  "fathers-day": "https://images.unsplash.com/photo-1604948501466-4e9c339b9c24?w=600",
  "valentines": "https://images.unsplash.com/photo-1518893883800-45cd0954574b?w=600",
};

const FALLBACK_IMAGE = "/images/occasions/birthday.jpg";

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
