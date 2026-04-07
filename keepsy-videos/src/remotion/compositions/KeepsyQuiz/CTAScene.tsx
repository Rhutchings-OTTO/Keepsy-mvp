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

  // "Keepsy" — large spring scale-up
  const logoSpring = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 260, stiffness: 320, mass: 0.5 },
    from: 0,
    to: 1,
  });
  const logoScale = interpolate(logoSpring, [0, 1], [0.65, 1]);
  const logoOp    = interpolate(logoSpring, [0, 0.5], [0, 1], clamp);

  // Gold accent line
  const accentW = interpolate(frame, [18, 52], [0, 220], clamp);

  // Subtitle fades in
  const subtitleOp = interpolate(frame, [50, 72], [0, 1], clamp);

  // URL fades in
  const urlOp = interpolate(frame, [72, 95], [0, 1], clamp);

  // Gold sparkles
  const sparkleOp = interpolate(frame, [60, 82], [0, 1], clamp);
  const sparkles = [
    { x: 90,  y: 500, size: 8,  phase: 0.0 },
    { x: 955, y: 450, size: 6,  phase: 1.6 },
    { x: 75,  y: 780, size: 7,  phase: 2.9 },
    { x: 950, y: 720, size: 5,  phase: 0.7 },
    { x: 520, y: 360, size: 6,  phase: 2.1 },
    { x: 160, y: 950, size: 5,  phase: 1.2 },
    { x: 870, y: 940, size: 7,  phase: 3.1 },
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
        {/* Keepsy wordmark */}
        <div
          style={{
            opacity: logoOp,
            transform: `scale(${logoScale})`,
            transformOrigin: "center center",
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 128,
            color: BRAND.ink,
            lineHeight: 1,
            letterSpacing: "-3px",
            marginBottom: 20,
          }}
        >
          Keepsy
        </div>

        {/* Gold accent line */}
        <div
          style={{
            width: accentW,
            height: 5,
            backgroundColor: BRAND.gold,
            borderRadius: 2,
            marginBottom: 48,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            opacity: subtitleOp,
            fontFamily: MANROPE,
            fontWeight: 500,
            fontSize: 44,
            color: BRAND.ink,
            textAlign: "center",
            lineHeight: 1.3,
            letterSpacing: "-0.4px",
            marginBottom: 36,
            maxWidth: 780,
          }}
        >
          Personalised gifts they'll never forget
        </div>

        {/* URL */}
        <div
          style={{
            opacity: urlOp,
            fontFamily: MANROPE,
            fontWeight: 600,
            fontSize: 52,
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
