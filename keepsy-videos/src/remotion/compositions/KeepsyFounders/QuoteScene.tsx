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

export const QuoteScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Quotation marks fade in
  const quotesOp = interpolate(frame, [8, 30], [0, 1], clamp);

  // Line 1: "The best gift isn't the most expensive one."
  const line1Op = interpolate(frame, [22, 58], [0, 1], clamp);
  const line1Y  = interpolate(frame, [22, 58], [18, 0], clamp);

  // Line 2: "It's the one that says:"
  const line2Op = interpolate(frame, [85, 116], [0, 1], clamp);
  const line2Y  = interpolate(frame, [85, 116], [15, 0], clamp);

  // "I remembered." — springs in with emphasis
  const remSpring = spring({
    frame: Math.max(0, frame - 130),
    fps,
    config: { damping: 220, stiffness: 140, mass: 0.85 },
    from: 0,
    to: 1,
  });
  const remScale = interpolate(remSpring, [0, 1], [0.72, 1]);
  const remOp    = interpolate(remSpring, [0, 0.5], [0, 1], clamp);

  // Gold shimmer on "I remembered."
  const shimmerPhase = Math.max(0, frame - 150);
  const shimmer = Math.abs(Math.sin(shimmerPhase * 0.14)) * 0.3 + 0.7;

  // Attribution fades in
  const attrOp = interpolate(frame, [178, 202], [0, 1], clamp);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.forest,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 80px",
        gap: 28,
      }}
    >
      {/* Large decorative quotation marks */}
      <div
        style={{
          position: "absolute",
          top: 100,
          left: 60,
          fontFamily: FRAUNCES,
          fontWeight: 700,
          fontSize: 220,
          color: BRAND.terracotta,
          opacity: quotesOp * 0.22,
          lineHeight: 1,
          letterSpacing: "-4px",
          userSelect: "none",
        }}
      >
        "
      </div>

      {/* Line 1 */}
      <div
        style={{
          opacity: line1Op,
          transform: `translateY(${line1Y}px)`,
          fontFamily: FRAUNCES,
          fontWeight: 400,
          fontSize: 60,
          color: BRAND.white,
          lineHeight: 1.2,
          letterSpacing: "-1.2px",
          textAlign: "center",
        }}
      >
        The best gift isn't the most expensive one.
      </div>

      {/* Line 2 */}
      <div
        style={{
          opacity: line2Op,
          transform: `translateY(${line2Y}px)`,
          fontFamily: FRAUNCES,
          fontWeight: 400,
          fontSize: 60,
          color: BRAND.white,
          lineHeight: 1.2,
          letterSpacing: "-1.2px",
          textAlign: "center",
        }}
      >
        It's the one that says:
      </div>

      {/* "I remembered." */}
      <div
        style={{
          opacity: remOp * shimmer,
          transform: `scale(${remScale})`,
          transformOrigin: "center center",
          fontFamily: FRAUNCES,
          fontWeight: 700,
          fontStyle: "italic",
          fontSize: 96,
          color: BRAND.gold,
          lineHeight: 1,
          letterSpacing: "-2.5px",
          textAlign: "center",
        }}
      >
        I remembered.
      </div>

      {/* Attribution */}
      <div
        style={{
          opacity: attrOp * 0.75,
          fontFamily: MANROPE,
          fontWeight: 400,
          fontSize: 32,
          color: BRAND.terracotta,
          textAlign: "center",
          letterSpacing: "-0.1px",
          marginTop: 8,
        }}
      >
        — Rory & Dan, Co-Founders of Keepsy
      </div>
    </AbsoluteFill>
  );
};
