"use client";

import Image from "next/image";
import { MagneticLink } from "@/components/ui/MagneticLink";

/** Pre-generated design previews to inspire when user has no designs yet */
const GALLERY_ITEMS = [
  "/occasion-tiles/christmas-scene.png",
  "/occasion-tiles/pet-gifts-portrait.png",
  "/occasion-tiles/anniversary-watercolor.png",
  "/occasion-tiles/birthday-confetti.png",
  "/occasion-tiles/mothers-day-floral.png",
  "/mockup-previews/preview-tee-blue.png",
  "/mockup-previews/preview-hoodie-black.png",
  "/mockup-previews/preview-plain-mug-front.png",
  "/mockup-previews/preview-plain-card.png",
];

type GalleryOfThePossibleProps = {
  title?: string;
  subtitle?: string;
  ctaHref?: string;
  ctaLabel?: string;
  className?: string;
};

export function GalleryOfThePossible({
  title = "Gallery of the Possible",
  subtitle = "Your designs will appear here. Until then, explore what others have imagined.",
  ctaHref = "/create",
  ctaLabel = "Create your first design",
  className = "",
}: GalleryOfThePossibleProps) {
  return (
    <div className={`rounded-2xl border border-charcoal/8 bg-white p-5 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.12)] sm:p-8 ${className}`}>
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/40">Inspiration</p>
        <h2 className="mt-3 font-serif text-2xl font-bold tracking-[-0.03em] text-charcoal">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-charcoal/60">{subtitle}</p>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
        {GALLERY_ITEMS.map((src, i) => (
          <div
            key={src}
            className="relative aspect-square overflow-hidden rounded-[1.2rem] border border-white/65 bg-white/68"
            style={{ filter: `blur(${i % 3 === 1 ? 3 : 4}px)`, opacity: 0.78 }}
          >
            <Image
              src={src}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 33vw, 120px"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0)_45%,rgba(255,255,255,0.22))]" />
          </div>
        ))}
      </div>
      <MagneticLink
        href={ctaHref}
        className="mt-7 inline-block rounded-full bg-terracotta px-6 py-3 font-semibold !text-white shadow-terra-glow transition hover:opacity-90"
      >
        {ctaLabel}
      </MagneticLink>
    </div>
  );
}
