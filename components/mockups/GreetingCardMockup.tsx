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
            : "/product-tiles/greeting-card-pack-mockup.png"}
          alt={isUS ? "US greeting card" : "Greeting card pack"}
          fill
          className="object-contain"
          quality={90}
          sizes="(max-width: 1024px) 68vw, 400px"
          priority={false}
        />

        {/* AI artwork overlay on the front card face.
            US: front card face spans approx left 4%→87%, top 3%→90% of the image.
            Overlay inset ~12% from each card-face edge gives the white printed border.
            UK: front card spans approx left 38%→80%, top 8%→88% of the image. */}
        <div
          className="absolute"
          style={isUS ? {
            left: "11%",
            top: "10%",
            width: "65%",
            height: "70%",
          } : {
            left: "38%",
            top: "8%",
            width: "42%",
            height: "80%",
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
                top: "3%",
                left: "3%",
                width: "94%",
                height: "94%",
                objectFit: "contain",
                filter: "saturate(0.94) contrast(1.01) brightness(0.99)",
                mixBlendMode: isUS ? undefined : "multiply",
              }}
            />
          ) : (
            <div
              style={{
                position: "absolute",
                top: "3%",
                left: "3%",
                width: "94%",
                height: "94%",
                background: "rgba(220, 210, 200, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 4,
                borderRadius: 2,
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

        {/* Subtle bottom vignette for depth */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/[0.04]"
          aria-hidden
        />
      </div>
    </div>
  );
});
