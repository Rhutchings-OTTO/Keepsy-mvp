"use client";

import { memo } from "react";

type CanvasMockupProps = {
  /** Width/height ratio of the canvas (width ÷ height) */
  aspectRatio: number;
  /** The image to display on the canvas face */
  imageSrc: string | null;
  className?: string;
};

/**
 * Pure CSS/HTML canvas print mockup.
 * Shows a gallery-wrapped canvas hanging on a subtle wall.
 * The depth stripe is rendered with CSS gradients — no images, no API calls.
 */
export const CanvasMockup = memo(function CanvasMockup({
  aspectRatio,
  imageSrc,
  className = "",
}: CanvasMockupProps) {
  // Depth bar thickness relative to the wrapper — kept proportional
  const DEPTH_PX = 14;
  const CORNER_R = 2;

  // Wrapper maintains the aspect ratio of the canvas face (plus a small margin for the wall)
  const wrapperPaddingPct = 8; // % padding around the canvas for wall feel

  return (
    <div
      className={`relative w-full flex items-center justify-center ${className}`}
      style={{
        // Wall — warm cream gradient, subtle
        background: "linear-gradient(160deg, #F5F0EB 0%, #EDE7DF 55%, #E4DDD4 100%)",
        aspectRatio: `${aspectRatio + 0.12} / 1`,
        borderRadius: "1.5rem",
        overflow: "hidden",
      }}
    >
      {/* Subtle ambient light blobs on the wall */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 70% at 30% 35%, rgba(255,245,235,0.55) 0%, transparent 65%), " +
            "radial-gradient(40% 50% at 72% 65%, rgba(220,210,200,0.3) 0%, transparent 60%)",
        }}
      />

      {/* Canvas outer wrapper — adds the depth + shadow */}
      <div
        className="relative"
        style={{
          width: `${100 - wrapperPaddingPct * 2}%`,
          aspectRatio: `${aspectRatio}`,
          // Multi-layer shadow: diffuse ambient + tight contact
          filter:
            "drop-shadow(0 8px 32px rgba(0,0,0,0.22)) drop-shadow(0 2px 6px rgba(0,0,0,0.14))",
        }}
      >
        {/* ── Canvas face ─────────────────────────────────────────────── */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ borderRadius: `${CORNER_R}px ${CORNER_R}px 0 0` }}
        >
          {imageSrc ? (
            // Use a plain <img> so data URLs (from the crop tool) work without Next.js domain config
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt="Canvas print preview"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            /* Placeholder when no image yet */
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "#E8E0D8" }}
            >
              <div className="text-center opacity-30 select-none">
                <div className="text-5xl mb-2">🖼</div>
                <p className="text-xs font-semibold tracking-wide uppercase">Your art here</p>
              </div>
            </div>
          )}
          {/* Subtle specular glare on the canvas face */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 45%)",
            }}
          />
        </div>

        {/* ── Bottom depth stripe ─────────────────────────────────────── */}
        <div
          className="absolute left-0 right-0"
          style={{
            top: "100%",
            height: DEPTH_PX,
            background: "linear-gradient(to bottom, #5a4a3a, #3d3028)",
            borderRadius: `0 0 ${CORNER_R}px ${CORNER_R}px`,
          }}
        />

        {/* ── Right depth stripe ──────────────────────────────────────── */}
        <div
          className="absolute top-0 bottom-0"
          style={{
            left: "100%",
            width: DEPTH_PX,
            background: "linear-gradient(to right, #4a3c2e, #2e241c)",
            borderRadius: `0 ${CORNER_R}px ${CORNER_R}px 0`,
          }}
        />

        {/* ── Bottom-right depth corner ────────────────────────────────── */}
        <div
          className="absolute"
          style={{
            top: "100%",
            left: "100%",
            width: DEPTH_PX,
            height: DEPTH_PX,
            background: "#2a1e14",
            borderRadius: `0 0 ${CORNER_R}px 0`,
          }}
        />

        {/* ── Gallery-wrap edge detail on face ────────────────────────── */}
        {/* Thin dark inner border simulating the wrapped edge meeting the face */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow: "inset 0 0 0 1.5px rgba(0,0,0,0.18)",
            borderRadius: `${CORNER_R}px ${CORNER_R}px 0 0`,
          }}
        />
      </div>

      {/* Wall nail / hanging point hint — very subtle */}
      <div
        aria-hidden
        className="absolute"
        style={{
          top: "7%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "rgba(160,140,120,0.35)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
        }}
      />
    </div>
  );
});
