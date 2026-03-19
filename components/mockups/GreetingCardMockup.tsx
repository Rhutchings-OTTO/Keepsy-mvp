"use client";

import { memo } from "react";

type GreetingCardMockupProps = {
  /** AI-generated image to show on the card front. null = placeholder. */
  imageSrc: string | null;
  className?: string;
};

/**
 * Greeting card (7-pack) mockup.
 * Pure CSS — no images, no external libs.
 *
 * Shows a portrait folding card standing upright with a slight perspective tilt
 * so the left spine (fold edge) is visible, making it clear this is a folding
 * card rather than a flat postcard. AI image appears on the front cover.
 *
 * Visually distinct from the flat landscape postcard mockup.
 */

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ src, style }: { src: string; style: React.CSSProperties }) => (
  <img src={src} alt="" aria-hidden draggable={false} style={style} />
);

export const GreetingCardMockup = memo(function GreetingCardMockup({
  imageSrc,
  className = "",
}: GreetingCardMockupProps) {
  // Width of the fold spine strip (simulates card thickness / fold edge).
  const SPINE_W = 11; // px

  // The "inside page" panel angled back from the spine — simulates an open card.
  // We fake the foreshortening by giving it a narrower rendered width.
  const INSIDE_W = 32; // % of front-panel width, foreshortened

  const faceContent = imageSrc ? (
    <Img
      src={imageSrc}
      style={{
        position: "absolute",
        top: "9%",
        left: "9%",
        width: "82%",
        height: "82%",
        objectFit: "contain",
        // Warm slightly for matte card feel
        filter: "saturate(0.96) brightness(0.98)",
      }}
    />
  ) : (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(145deg, #DDD4C9 0%, #C9BDB2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ fontSize: "2rem", opacity: 0.35 }}>✉</div>
      <p
        style={{
          fontSize: "0.55rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#5a4a40",
          opacity: 0.5,
        }}
      >
        Your design here
      </p>
    </div>
  );

  return (
    <div
      className={`relative w-full ${className}`}
      style={{
        aspectRatio: "1.55 / 1",
        background: "linear-gradient(175deg, #FAF7F3 0%, #F0EAE2 45%, #E7DFD6 100%)",
        borderRadius: "1.5rem",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Ambient wall light — matches CanvasMockup */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(62% 72% at 38% 28%, rgba(255,252,248,0.65) 0%, transparent 65%)," +
            "radial-gradient(38% 48% at 78% 72%, rgba(210,202,192,0.22) 0%, transparent 55%)",
          pointerEvents: "none",
        }}
      />

      {/* Shelf / ground shadow — card is standing upright */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: "14%",
          left: "33%",
          right: "33%",
          height: 12,
          background: "rgba(60,40,30,0.14)",
          filter: "blur(7px)",
          borderRadius: "50%",
        }}
      />

      {/*
       * ── Card 3D assembly ───────────────────────────────────────────────────
       * rotateY(-8deg) tilts the whole card so the spine (left edge) becomes
       * visible, making it obviously a folded card rather than a flat postcard.
       * marginLeft shifts it right so the inside-panel peeks out without clipping.
       */}
      <div
        style={{
          position: "relative",
          height: "76%",
          aspectRatio: "5 / 7",
          transform: "perspective(900px) rotateY(-8deg)",
          transformOrigin: "55% 50%",
          // Shift slightly right so inside panel + spine fit within the container
          marginLeft: "4%",
          filter:
            "drop-shadow(0 3px 6px rgba(0,0,0,0.22))" +
            " drop-shadow(0 10px 26px rgba(0,0,0,0.12))" +
            " drop-shadow(0 22px 52px rgba(0,0,0,0.05))",
        }}
      >
        {/* ── Inside-left panel — angled back from fold ─────────────────────
         * Simulates the inside-left page visible because the card is open.
         * Positioned to the left of the front panel.
         * Its width is intentionally narrow to simulate perspective foreshortening
         * of an ~45° open angle.
         */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            // Position to the left of the front panel (right edge at the fold)
            right: `calc(100% + ${SPINE_W}px)`,
            width: `${INSIDE_W}%`,
            height: "100%",
            background: "#f4f0ec",
            borderRadius: "2px 0 0 2px",
            overflow: "hidden",
          }}
        >
          {/* Subtle ruled lines — inside-page feel */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "repeating-linear-gradient(to bottom, transparent, transparent 24px, rgba(0,0,0,0.04) 24px, rgba(0,0,0,0.04) 25px)",
              backgroundPosition: "0 18px",
            }}
          />
          {/* Left-edge shading: darker on far left, lightens toward fold */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to right, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.04) 100%)",
            }}
          />
        </div>

        {/* ── Spine (fold edge) ─────────────────────────────────────────────
         * The visible left edge of the front cover — represents the card fold.
         */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            right: "100%",
            width: SPINE_W,
            height: "100%",
            borderRadius: "2px 0 0 2px",
            background: "#e8e0d8",
            overflow: "hidden",
          }}
        >
          {/* Shading: darker on left, lighter meeting front face */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to right, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.05) 100%)",
            }}
          />
        </div>

        {/* ── Front cover ───────────────────────────────────────────────────
         * Portrait card face with AI image (contain-fit, white border).
         */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            borderRadius: "0 3px 3px 0",
            background: "#ffffff",
          }}
        >
          {faceContent}

          {/* Glossy sheen — upper-left highlight */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.30) 0%, transparent 48%)",
              pointerEvents: "none",
            }}
          />

          {/* Overhead top-edge highlight */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.45) 0%, transparent 100%)",
              pointerEvents: "none",
            }}
          />

          {/* Inset border */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.07)",
              borderRadius: "0 3px 3px 0",
              pointerEvents: "none",
            }}
          />

          {/* Fold-line shadow — left edge of front face */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 5,
              height: "100%",
              background:
                "linear-gradient(to right, rgba(0,0,0,0.12), transparent)",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
});
