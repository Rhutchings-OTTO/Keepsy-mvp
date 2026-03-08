"use client";

import { memo } from "react";

type CanvasMockupProps = {
  /** Width/height ratio of the canvas face (width ÷ height) */
  aspectRatio: number;
  /** The image to display on the canvas face (data URL or https) */
  imageSrc: string | null;
  className?: string;
};

/**
 * Premium gallery-wrapped canvas print mockup.
 * - Subtle CSS perspective tilt so left + bottom edges are visible
 * - Gallery-wrap: the image continues around the left and bottom edges, darkened
 * - Canvas weave texture overlay at very low opacity
 * - Multi-layer drop-shadow for depth realism
 * - Warm studio-wall background
 * Pure CSS — no images, no external libs, no API calls.
 */

// Tiny repeating SVG canvas-weave texture (horizontal + vertical intersecting threads).
// Keeps it lightweight: a 6×6px SVG tile that tiles infinitely.
const WEAVE_TEXTURE_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='6'%3E" +
  "%3Cline x1='0' y1='1.5' x2='6' y2='1.5' stroke='%23000' stroke-width='0.5' stroke-opacity='0.06'/%3E" +
  "%3Cline x1='0' y1='4.5' x2='6' y2='4.5' stroke='%23000' stroke-width='0.5' stroke-opacity='0.04'/%3E" +
  "%3Cline x1='1.5' y1='0' x2='1.5' y2='6' stroke='%23000' stroke-width='0.5' stroke-opacity='0.05'/%3E" +
  "%3Cline x1='4.5' y1='0' x2='4.5' y2='6' stroke='%23000' stroke-width='0.5' stroke-opacity='0.035'/%3E" +
  "%3C/svg%3E";

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ src, style }: { src: string; style: React.CSSProperties }) => (
  <img src={src} alt="" aria-hidden draggable={false} style={style} />
);

export const CanvasMockup = memo(function CanvasMockup({
  aspectRatio,
  imageSrc,
  className = "",
}: CanvasMockupProps) {
  //
  // Depth of gallery wrap — represents ~1.25" edge. 14px works well across responsive sizes.
  // We expose it as a CSS var so both the left and bottom edges share the same computed value.
  //
  const DEPTH = 14; // px

  // The wall container aspect ratio is slightly wider than the canvas to show wall context.
  const wallAspect = Math.max(aspectRatio, 0.55) + 0.22;

  const faceCoverStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    // Slightly desaturate + warm the image to simulate matte canvas ink
    filter: "saturate(0.94) brightness(0.97)",
  };

  const faceContent = imageSrc ? (
    <Img src={imageSrc} style={faceCoverStyle} />
  ) : (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(145deg, #DDD4C9 0%, #C9BDB2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center", opacity: 0.32, userSelect: "none", pointerEvents: "none" }}>
        <div style={{ fontSize: "2.8rem", marginBottom: "0.4rem" }}>🖼</div>
        <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#5a4a40" }}>
          Your art here
        </p>
      </div>
    </div>
  );

  return (
    <div
      className={`relative w-full ${className}`}
      style={{
        aspectRatio: `${wallAspect} / 1`,
        // Warm studio wall — subtle top-lit gradient
        background: "linear-gradient(175deg, #FAF7F3 0%, #F0EAE2 45%, #E7DFD6 100%)",
        borderRadius: "1.5rem",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Wall ambient light — soft key light from upper-left */}
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

      {/* Wall hanging wire / nail hint — very subtle */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "8%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "rgba(148, 128, 112, 0.45)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
        }}
      />

      {/*
       * ── Canvas 3D assembly ─────────────────────────────────────────────────
       * Slight perspective tilt: rotateX shows bottom edge, rotateY(-) shows left edge.
       * offset slightly right (marginLeft) so left depth strip is not clipped by wall container.
       */}
      <div
        style={{
          position: "relative",
          width: "76%",
          aspectRatio: `${aspectRatio}`,
          // Subtle 3D tilt — just enough to show left + bottom edges
          transform: "perspective(1000px) rotateX(2deg) rotateY(-3deg)",
          transformOrigin: "55% 50%",
          // Shift slightly right so the left edge fits within the wall
          marginRight: "3%",
          // Realistic multi-layer shadow:
          //   layer 1 — tight contact shadow right under the frame
          //   layer 2 — mid-range ambient
          //   layer 3 — broad diffuse fill
          filter:
            "drop-shadow(0 2px 3px rgba(0,0,0,0.22))" +
            " drop-shadow(0 8px 20px rgba(0,0,0,0.11))" +
            " drop-shadow(0 20px 48px rgba(0,0,0,0.05))",
        }}
      >
        {/* ── Canvas face ────────────────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            borderRadius: "1px 1px 0 0",
          }}
        >
          {faceContent}

          {/* Canvas weave texture — simulates fabric grain */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url("${WEAVE_TEXTURE_URL}")`,
              backgroundRepeat: "repeat",
              backgroundSize: "6px 6px",
              pointerEvents: "none",
              // Use multiply so texture darkens the image slightly without a flat overlay
              mixBlendMode: "multiply",
              opacity: 0.85,
            }}
          />

          {/* Overhead light highlight — thin bright line at the top edge */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: "linear-gradient(to bottom, rgba(255,255,255,0.38) 0%, transparent 100%)",
              pointerEvents: "none",
            }}
          />

          {/* Gallery-wrap inner border + subtle inset fabric shadow */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              boxShadow:
                "inset 0 0 0 1px rgba(0,0,0,0.13)," +
                "inset 3px 3px 12px rgba(0,0,0,0.045)," +
                "inset -2px -2px 8px rgba(0,0,0,0.03)",
              borderRadius: "1px 1px 0 0",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* ── Left edge — gallery wrap ──────────────────────────────────── */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            right: "100%",
            bottom: DEPTH, // leave corner gap
            width: DEPTH,
            overflow: "hidden",
            borderRadius: "1px 0 0 0",
          }}
        >
          {/* Wrapped image strip on left edge */}
          {imageSrc && (
            <Img
              src={imageSrc}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                // Show the leftmost portion of the image on this edge
                objectPosition: "0% 50%",
                filter: "brightness(0.48) saturate(0.75)",
              }}
            />
          )}
          {/* Shadow gradient — darker on left, lighter toward face */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: imageSrc
                ? "linear-gradient(to right, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.12) 100%)"
                : "linear-gradient(to right, #281c12, #42301f)",
            }}
          />
        </div>

        {/* ── Bottom edge — gallery wrap ────────────────────────────────── */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "100%",
            left: DEPTH, // leave corner gap
            right: 0,
            height: DEPTH,
            overflow: "hidden",
            borderRadius: "0 0 1px 0",
          }}
        >
          {/* Wrapped image strip on bottom edge */}
          {imageSrc && (
            <Img
              src={imageSrc}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                // Show the bottommost portion of the image on this edge
                objectPosition: "50% 100%",
                filter: "brightness(0.42) saturate(0.7)",
              }}
            />
          )}
          {/* Shadow gradient — lighter at top (meeting face), darker at bottom */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: imageSrc
                ? "linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.55) 100%)"
                : "linear-gradient(to bottom, #3d2c1e, #1e1208)",
            }}
          />
        </div>

        {/* ── Bottom-left corner ──────────────────────────────────────────── */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "100%",
            right: "100%",
            width: DEPTH,
            height: DEPTH,
            // Darkest corner — where left and bottom edges meet
            background: "linear-gradient(135deg, #1a1008, #2e1e10)",
            borderRadius: "0 0 0 1px",
          }}
        />
      </div>
    </div>
  );
});
