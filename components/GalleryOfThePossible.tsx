"use client";

import Image from "next/image";
import Link from "next/link";

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
    <div className={`rounded-3xl frosted-glass p-8 text-center ${className}`}>
      <h2 className="font-serif text-2xl font-bold text-obsidian">{title}</h2>
      <p className="mt-2 text-sm text-obsidian/60">{subtitle}</p>
      <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-3">
        {GALLERY_ITEMS.map((src, i) => (
          <div
            key={src}
            className="relative aspect-square overflow-hidden rounded-xl"
            style={{ filter: "blur(4px)", opacity: 0.7 }}
          >
            <Image
              src={src}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 33vw, 120px"
            />
          </div>
        ))}
      </div>
      <Link
        href={ctaHref}
        className="mt-6 inline-block rounded-full bg-obsidian px-6 py-3 font-bold text-white transition hover:bg-obsidian/90"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
