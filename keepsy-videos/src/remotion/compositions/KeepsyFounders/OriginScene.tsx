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

export const OriginScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Line 1: Dan's story — fades in gently
  const line1Op = interpolate(frame, [15, 60], [0, 1], clamp);
  const line1Y  = interpolate(frame, [15, 60], [20, 0], clamp);

  // Line 2: "He told his mate Rory..." — springs in after beat
  const line2Spring = spring({
    frame: Math.max(0, frame - 100),
    fps,
    config: { damping: 200, stiffness: 110, mass: 0.9 },
    from: 0,
    to: 1,
  });
  const line2Y  = interpolate(line2Spring, [0, 1], [24, 0]);
  const line2Op = interpolate(line2Spring, [0, 0.8], [0, 1], clamp);

  // Line 3: "So they built..." — fades in gently
  const line3Op = interpolate(frame, [152, 185], [0, 1], clamp);
  const line3Y  = interpolate(frame, [152, 185], [18, 0], clamp);

  // Terracotta accent dot before line 2
  const dotOp = interpolate(frame, [95, 115], [0, 1], clamp);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.creamDark,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "0 80px",
        gap: 0,
      }}
    >
      {/* Line 1 */}
      <div
        style={{
          opacity: line1Op,
          transform: `translateY(${line1Y}px)`,
          fontFamily: MANROPE,
          fontWeight: 400,
          fontSize: 46,
          color: BRAND.ink,
          lineHeight: 1.45,
          letterSpacing: "-0.4px",
          marginBottom: 52,
        }}
      >
        Dan was looking for a birthday gift{"\n"}for his mum — something that{"\n"}said{" "}
        <span style={{ fontStyle: "italic", color: BRAND.terracotta }}>
          'I really see you.'
        </span>
      </div>

      {/* Terracotta accent dot */}
      <div
        style={{
          opacity: dotOp,
          width: 10,
          height: 10,
          borderRadius: "50%",
          backgroundColor: BRAND.terracotta,
          marginBottom: 20,
        }}
      />

      {/* Line 2 */}
      <div
        style={{
          opacity: line2Op,
          transform: `translateY(${line2Y}px)`,
          fontFamily: FRAUNCES,
          fontWeight: 600,
          fontSize: 56,
          color: BRAND.ink,
          lineHeight: 1.15,
          letterSpacing: "-1.2px",
          marginBottom: 48,
        }}
      >
        He told his mate Rory.{"\n"}
        <span style={{ opacity: 0.65 }}>Same problem. Different mum.</span>
      </div>

      {/* Line 3 */}
      <div
        style={{
          opacity: line3Op * 0.85,
          transform: `translateY(${line3Y}px)`,
          fontFamily: MANROPE,
          fontWeight: 400,
          fontSize: 42,
          color: BRAND.ink,
          lineHeight: 1.45,
          letterSpacing: "-0.3px",
        }}
      >
        So they built the thing they{"\n"}both wished existed.
      </div>
    </AbsoluteFill>
  );
};
