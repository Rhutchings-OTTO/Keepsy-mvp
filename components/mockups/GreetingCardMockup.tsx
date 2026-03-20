"use client";

import { memo } from "react";
import Image from "next/image";

type GreetingCardMockupProps = {
  /** AI-generated image to show on the front card face. null = placeholder. */
  imageSrc: string | null;
  className?: string;
};

/**
 * Greeting card (7-pack) mockup.
 * Uses the real product photo as the base with the AI artwork overlaid
 * on the front card face (the rightmost card facing the viewer).
 *
 * The front card occupies approximately:
 *   left: 55%–88%  top: 13%–84%  of the 1024×1536 base image.
 * The AI image is inset ~9% from each edge of the card face, matching
 * the white border that appears on the printed card.
 */
export const GreetingCardMockup = memo(function GreetingCardMockup({
  imageSrc,
  className = "",
}: GreetingCardMockupProps) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl border border-black/[0.06] bg-[#FAF9F7] shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_0_0_rgba(255,255,255,0.8)_inset] ${className}`}
      style={{ aspectRatio: "2 / 3" }}
    >
      <div className="absolute inset-[1px] overflow-hidden rounded-[22px] bg-[#F5F4F2]">
        {/* Base mockup: stack of 7 cards */}
        <Image
          src="/product-tiles/greeting-card-pack-mockup.png"
          alt="Greeting card pack"
          fill
          className="object-contain"
          quality={90}
          sizes="(max-width: 1024px) 68vw, 400px"
          priority={false}
        />

        {/* AI artwork overlay on the front card face.
            The front card spans left 55%→88%, top 13%→84% of the image.
            9% inset gives the white border around the printed area. */}
        <div
          className="absolute"
          style={{
            left: "55%",
            top: "13%",
            width: "33%",
            height: "71%",
            // The white card surface shows around the print — no bg needed,
            // the mockup image provides it. The overlay is transparent.
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
                top: "9%",
                left: "9%",
                width: "82%",
                height: "82%",
                objectFit: "contain",
                // Matte card feel — match server-side compositing
                filter: "saturate(0.94) contrast(1.01) brightness(0.99)",
                // Slight mix-blend to let card texture show through
                mixBlendMode: "multiply",
              }}
            />
          ) : (
            // Placeholder when no image generated yet
            <div
              style={{
                position: "absolute",
                top: "9%",
                left: "9%",
                width: "82%",
                height: "82%",
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
