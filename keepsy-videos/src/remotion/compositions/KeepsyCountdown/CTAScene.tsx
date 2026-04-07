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

export const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // "Keepsy" — spring scale-up
  const logoSpring = spring({
    frame: Math.max(0, frame - 6),
    fps,
    config: { damping: 260, stiffness: 340, mass: 0.45 },
    from: 0,
    to: 1,
  });
  const logoScale = interpolate(logoSpring, [0, 1], [0.6, 1]);
  const logoOp    = interpolate(logoSpring, [0, 0.5], [0, 1], clamp);

  // Gold line
  const lineW = interpolate(frame, [14, 46], [0, 210], clamp);

  // Tagline
  const tagOp = interpolate(frame, [34, 54], [0, 1], clamp);

  // URL
  const urlOp = interpolate(frame, [50, 70], [0, 1], clamp);

  // Gold sparkles
  const sparkleOp = interpolate(frame, [42, 62], [0, 1], clamp);
  const sparkles = [
    { x: 88,  y: 480, size: 9,  phase: 0.0 },
    { x: 960, y: 440, size: 7,  phase: 1.5 },
    { x: 72,  y: 760, size: 8,  phase: 2.8 },
    { x: 950, y: 710, size: 6,  phase: 0.9 },
    { x: 515, y: 340, size: 7,  phase: 2.2 },
    { x: 170, y: 940, size: 5,  phase: 1.1 },
    { x: 860, y: 930, size: 6,  phase: 3.0 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.cream }}>
      {/* Sparkles */}
      {sparkles.map((s, i) => {
        const pulse = Math.abs(Math.sin(frame * 0.11 + s.phase));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: s.size,
              height: s.size,
              borderRadius: "50%",
              backgroundColor: BRAND.gold,
              left: s.x,
              top: s.y,
              opacity: sparkleOp * (0.25 + 0.65 * pulse),
              transform: `scale(${0.5 + 0.6 * pulse})`,
            }}
          />
        );
      })}

      {/* Content */}
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
        {/* Keepsy */}
        <div
          style={{
            opacity: logoOp,
            transform: `scale(${logoScale})`,
            transformOrigin: "center center",
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 124,
            color: BRAND.ink,
            lineHeight: 1,
            letterSpacing: "-3px",
            marginBottom: 18,
          }}
        >
          Keepsy
        </div>

        {/* Gold line */}
        <div
          style={{
            width: lineW,
            height: 5,
            backgroundColor: BRAND.gold,
            borderRadius: 2,
            marginBottom: 48,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            opacity: tagOp,
            fontFamily: MANROPE,
            fontWeight: 500,
            fontSize: 46,
            color: BRAND.ink,
            textAlign: "center",
            lineHeight: 1.3,
            letterSpacing: "-0.4px",
            marginBottom: 32,
          }}
        >
          Personalised gifts. Made with love.
        </div>

        {/* URL */}
        <div
          style={{
            opacity: urlOp,
            fontFamily: MANROPE,
            fontWeight: 600,
            fontSize: 54,
            color: BRAND.terracotta,
            letterSpacing: "0.4px",
          }}
        >
          keepsy.store
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
