import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND, FRAUNCES, MANROPE } from "../KeepsyReel/fonts";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const TurnScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Forest green wipes in from left (0–25fr)
  const bgWipe = interpolate(frame, [0, 25], [0, 100], clamp);

  // "What if you could give them…" — slides up, line 1
  const s1 = spring({
    frame: Math.max(0, frame - 20),
    fps,
    config: { damping: 200, stiffness: 130, mass: 0.8 },
    from: 0,
    to: 1,
  });
  const line1Y  = interpolate(s1, [0, 1], [40, 0]);
  const line1Op = interpolate(s1, [0, 1], [0, 1]);

  // "Something they'd actually…" — line 2
  const s2 = spring({
    frame: Math.max(0, frame - 40),
    fps,
    config: { damping: 200, stiffness: 130, mass: 0.8 },
    from: 0,
    to: 1,
  });
  const line2Y  = interpolate(s2, [0, 1], [40, 0]);
  const line2Op = interpolate(s2, [0, 1], [0, 1]);

  // "keep?" — punches in fast, with gold shimmer
  const s3 = spring({
    frame: Math.max(0, frame - 62),
    fps,
    config: { damping: 260, stiffness: 480, mass: 0.35 },
    from: 0,
    to: 1,
  });
  const keepScale = interpolate(s3, [0, 1], [0.6, 1]);
  const keepOp    = interpolate(s3, [0, 0.5], [0, 1], clamp);

  // Gold shimmer pulse on "keep" — starts after it enters (frame 68+)
  const shimmerPhase = Math.max(0, frame - 68);
  const shimmer = Math.abs(Math.sin(shimmerPhase * 0.18)) * 0.4 + 0.6;

  // Terracotta underline under "keep?"
  const underlineWidth = interpolate(frame, [70, 100], [0, 160], clamp);

  // Subtitle fades in late
  const subtitleOp = interpolate(frame, [95, 120], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.cream }}>
      {/* Forest green wipes in from left */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: `${bgWipe}%`,
          backgroundColor: BRAND.forest,
        }}
      />

      {/* Content on top of green */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px",
          gap: 0,
          zIndex: 5,
        }}
      >
        {/* Line 1 */}
        <div
          style={{
            opacity: line1Op * 0.85,
            transform: `translateY(${line1Y}px)`,
            fontFamily: MANROPE,
            fontWeight: 500,
            fontSize: 56,
            color: BRAND.white,
            textAlign: "center",
            lineHeight: 1.2,
            letterSpacing: "-0.5px",
            marginBottom: 12,
          }}
        >
          What if you could give them…
        </div>

        {/* Line 2 */}
        <div
          style={{
            opacity: line2Op,
            transform: `translateY(${line2Y}px)`,
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 88,
            color: BRAND.white,
            textAlign: "center",
            lineHeight: 1.05,
            letterSpacing: "-2px",
            marginBottom: 8,
          }}
        >
          Something they'd actually
        </div>

        {/* "keep?" — gold shimmer */}
        <div
          style={{
            opacity: keepOp,
            transform: `scale(${keepScale})`,
            transformOrigin: "center center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              fontFamily: FRAUNCES,
              fontWeight: 700,
              fontStyle: "italic",
              fontSize: 108,
              color: BRAND.gold,
              lineHeight: 1,
              letterSpacing: "-2.5px",
              opacity: shimmer,
            }}
          >
            keep?
          </div>
          {/* Terracotta underline */}
          <div
            style={{
              width: underlineWidth,
              height: 5,
              backgroundColor: BRAND.terracotta,
              borderRadius: 2,
            }}
          />
        </div>

        {/* Subtitle */}
        <div
          style={{
            marginTop: 52,
            opacity: subtitleOp,
            fontFamily: MANROPE,
            fontWeight: 500,
            fontSize: 38,
            color: BRAND.white,
            textAlign: "center",
            lineHeight: 1.35,
            letterSpacing: "-0.3px",
            maxWidth: 700,
          }}
        >
          A gift that tells their story — not just fills a drawer.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
