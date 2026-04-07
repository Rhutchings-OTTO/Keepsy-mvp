import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND, FRAUNCES, MANROPE } from "../KeepsyReel/fonts";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Small founders image fades in
  const imgOp = interpolate(frame, [8, 32], [0, 1], clamp);

  // "Keepsy" springs in
  const logoSpring = spring({
    frame: Math.max(0, frame - 22),
    fps,
    config: { damping: 200, stiffness: 120, mass: 0.95 },
    from: 0,
    to: 1,
  });
  const logoScale = interpolate(logoSpring, [0, 1], [0.75, 1]);
  const logoOp    = interpolate(logoSpring, [0, 0.6], [0, 1], clamp);

  // Gold line
  const lineW = interpolate(frame, [34, 65], [0, 200], clamp);

  // Quote fades in
  const quoteOp = interpolate(frame, [55, 90], [0, 1], clamp);

  // URL fades in
  const urlOp = interpolate(frame, [82, 108], [0, 1], clamp);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.creamDark,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 80px",
        gap: 24,
      }}
    >
      {/* Small founders cartoon — top centre */}
      <div
        style={{
          opacity: imgOp,
          width: "36%",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 8px 28px rgba(45,41,38,0.10)",
          marginBottom: 8,
        }}
      >
        <Img
          src={staticFile("images/founders-cartoon.png")}
          style={{ width: "100%", display: "block" }}
        />
      </div>

      {/* "Keepsy" */}
      <div
        style={{
          opacity: logoOp,
          transform: `scale(${logoScale})`,
          transformOrigin: "center center",
          fontFamily: FRAUNCES,
          fontWeight: 700,
          fontSize: 104,
          color: BRAND.ink,
          lineHeight: 1,
          letterSpacing: "-2.5px",
        }}
      >
        Keepsy
      </div>

      {/* Gold line */}
      <div
        style={{
          width: lineW,
          height: 4,
          backgroundColor: BRAND.gold,
          borderRadius: 2,
        }}
      />

      {/* Closing quote */}
      <div
        style={{
          opacity: quoteOp * 0.75,
          fontFamily: MANROPE,
          fontWeight: 400,
          fontStyle: "italic",
          fontSize: 36,
          color: BRAND.ink,
          textAlign: "center",
          lineHeight: 1.55,
          letterSpacing: "-0.2px",
          maxWidth: 780,
          marginTop: 4,
        }}
      >
        "We just wanted to make our mums smile.{"\n"}Turns out, a lot of people feel the same way."
      </div>

      {/* URL */}
      <div
        style={{
          opacity: urlOp,
          fontFamily: MANROPE,
          fontWeight: 600,
          fontSize: 48,
          color: BRAND.terracotta,
          letterSpacing: "0.3px",
          marginTop: 8,
        }}
      >
        keepsy.store
      </div>
    </AbsoluteFill>
  );
};
