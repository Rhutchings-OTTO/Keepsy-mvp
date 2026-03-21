"use client";

import { memo } from "react";
import Image from "next/image";

type GreetingCardMockupProps = {
  /** AI-generated image to show on the front card face. null = placeholder. */
  imageSrc: string | null;
  className?: string;
  /** "uk" = portrait 7-pack stack mockup (default); "us" = portrait single-card stack mockup (BP 1094) */
  variant?: "uk" | "us";
};

/**
 * Greeting card mockup.
 *
 * variant="uk" (default): portrait 7-pack stack using the real product photo.
 * variant="us": portrait single-card stack with kraft envelopes (BP 1094).
 *   AI image overlaid on the front white card face, inset ~12% on each
 *   side to show the printed white border — matching server-side compositing.
 */
export const GreetingCardMockup = memo(function GreetingCardMockup({
  imageSrc,
  className = "",
  variant = "uk",
}: GreetingCardMockupProps) {
  const isUS = variant === "us";

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl border border-black/[0.06] bg-[#FAF9F7] shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_0_0_rgba(255,255,255,0.8)_inset] ${className}`}
      style={{ aspectRatio: "2 / 3" }}
    >
      <div className="absolute inset-[1px] overflow-hidden rounded-[22px] bg-[#F5F4F2]">
        {/* Base mockup photo */}
        <Image
          src={isUS
            ? "/product-tiles/us-greeting-card-mockup.png"
            : "/product-tiles/uk-greeting-card-mockup.png"}
          alt={isUS ? "US greeting card" : "UK greeting card pack"}
          fill
          className="object-contain"
          quality={90}
          sizes="(max-width: 1024px) 68vw, 400px"
          priority={false}
        />

        {/* Layer 1: Card face bounding box — measured from actual pixel data (1024×1536 photos).
            UK:  left edge x=305 (30%), right x=843 (82%), top y=378 (25%), bottom y=1077 (70%).
                 Outer box adds ~1% margin: left 29%, top 24%, right 83%, bottom 71%.
            US:  left edge x=295 (29%), right x=843 (82%), top y=347 (23%), bottom y=1115 (72%).
                 Outer box adds ~1% margin: left 28%, top 22%, right 83%, bottom 73%. */}
        <div
          className="absolute overflow-hidden"
          style={isUS ? {
            left: "28%",
            top: "22%",
            width: "55%",
            height: "51%",
          } : {
            left: "29%",
            top: "24%",
            width: "54%",
            height: "47%",
          }}
        >
          {/* Layer 2: 8% safe-zone inset on all 4 sides — image sits within an 84%×84% area.
              contain fit maximises within that zone without ever cropping or distorting. */}
          <div
            style={{
              position: "absolute",
              inset: "8%",
            }}
          >
            {imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageSrc}
                alt="Your design"
                draggable={false}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  objectPosition: "center center",
                  filter: "saturate(0.94) contrast(1.01) brightness(0.99)",
                  mixBlendMode: isUS ? undefined : "multiply",
                }}
              />
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(220, 210, 200, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div style={{ fontSize: "1.2rem", opacity: 0.3 }}>✉</div>
                <p
                  style={{
                    fontSize: "0.42rem",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#5a4a40",
                    opacity: 0.45,
                    textAlign: "center",
                  }}
                >
                  Your design here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Subtle bottom vignette for depth */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/[0.04]"
          aria-hidden
        />
      </div>
    </div>
  );
});
