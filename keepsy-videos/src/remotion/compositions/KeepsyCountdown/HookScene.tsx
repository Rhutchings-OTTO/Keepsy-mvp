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

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Line 1: "5 reasons your gifts are" — punches in
  const s1 = spring({
    frame,
    fps,
    config: { damping: 300, stiffness: 480, mass: 0.38 },
    from: 0,
    to: 1,
  });
  const line1Scale = interpolate(s1, [0, 1], [0.62, 1]);
  const line1Op    = interpolate(s1, [0, 0.5], [0, 1], clamp);

  // "boring" — punches in slightly after with extra oomph
  const s2 = spring({
    frame: Math.max(0, frame - 6),
    fps,
    config: { damping: 220, stiffness: 550, mass: 0.35 },
    from: 0,
    to: 1,
  });
  const boringScale = interpolate(s2, [0, 1], [0.5, 1]);
  const boringOp    = interpolate(s2, [0, 0.4], [0, 1], clamp);

  // Subtext: cheeky nudge
  const subOp = interpolate(frame, [30, 50], [0, 1], clamp);

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
      {/* Line 1 */}
      <div
        style={{
          opacity: line1Op,
          transform: `scale(${line1Scale})`,
          transformOrigin: "center center",
          fontFamily: FRAUNCES,
          fontWeight: 700,
          fontSize: 84,
          color: BRAND.white,
          lineHeight: 1.05,
          letterSpacing: "-2px",
          textAlign: "center",
        }}
      >
        5 reasons your gifts are
      </div>

      {/* "boring" — terracotta, extra big */}
      <div
        style={{
          opacity: boringOp,
          transform: `scale(${boringScale})`,
          transformOrigin: "center center",
          fontFamily: FRAUNCES,
          fontWeight: 700,
          fontStyle: "italic",
          fontSize: 128,
          color: BRAND.terracotta,
          lineHeight: 1,
          letterSpacing: "-3px",
          textAlign: "center",
        }}
      >
        boring
      </div>

      {/* Terracotta underline */}
      <div
        style={{
          width: interpolate(frame, [10, 42], [0, 200], clamp),
          height: 5,
          backgroundColor: BRAND.terracotta,
          borderRadius: 2,
        }}
      />

      {/* Subtext */}
      <div
        style={{
          opacity: subOp * 0.65,
          fontFamily: MANROPE,
          fontWeight: 500,
          fontSize: 38,
          color: BRAND.white,
          textAlign: "center",
          lineHeight: 1.3,
          letterSpacing: "-0.3px",
        }}
      >
        (Harsh? Maybe. True? Definitely.)
      </div>
    </AbsoluteFill>
  );
};
