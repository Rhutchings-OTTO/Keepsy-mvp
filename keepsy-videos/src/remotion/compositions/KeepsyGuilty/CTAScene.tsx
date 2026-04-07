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

  // Forest green fills from bottom (0–20fr)
  const bgWipe = interpolate(frame, [0, 20], [100, 0], clamp);

  // "keepsy.store" — fast punch-in
  const urlSpring = spring({
    frame: Math.max(0, frame - 18),
    fps,
    config: { damping: 280, stiffness: 420, mass: 0.4 },
    from: 0,
    to: 1,
  });
  const urlScale = interpolate(urlSpring, [0, 1], [0.7, 1]);
  const urlOp    = interpolate(urlSpring, [0, 0.5], [0, 1], clamp);

  // Tagline slides up
  const tagSpring = spring({
    frame: Math.max(0, frame - 32),
    fps,
    config: { damping: 200, stiffness: 130, mass: 0.8 },
    from: 0,
    to: 1,
  });
  const tagY  = interpolate(tagSpring, [0, 1], [30, 0]);
  const tagOp = interpolate(tagSpring, [0, 1], [0, 1]);

  // Wordmark fades in at the end
  const wordmarkOp = interpolate(frame, [44, 56], [0, 0.5], clamp);

  // Gold sparkles
  const sparkleOp = interpolate(frame, [20, 38], [0, 1], clamp);
  const sparkles = [
    { x: 80,  y: 460, size: 9,  phase: 0.0 },
    { x: 970, y: 420, size: 7,  phase: 1.4 },
    { x: 65,  y: 760, size: 8,  phase: 2.7 },
    { x: 960, y: 700, size: 6,  phase: 0.8 },
    { x: 510, y: 320, size: 7,  phase: 2.2 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.creamDark }}>
      {/* Forest green fills from bottom */}
      <div
        style={{
          position: "absolute",
          top: `${bgWipe}%`,
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: BRAND.forest,
        }}
      />

      {/* Sparkles */}
      {sparkles.map((s, i) => {
        const pulse = Math.abs(Math.sin(frame * 0.12 + s.phase));
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
              opacity: sparkleOp * (0.3 + 0.6 * pulse),
              transform: `scale(${0.5 + 0.6 * pulse})`,
              zIndex: 10,
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
          zIndex: 5,
          gap: 20,
        }}
      >
        {/* keepsy.store */}
        <div
          style={{
            opacity: urlOp,
            transform: `scale(${urlScale})`,
            transformOrigin: "center center",
            fontFamily: MANROPE,
            fontWeight: 700,
            fontSize: 72,
            color: BRAND.terracotta,
            letterSpacing: "0.5px",
            textAlign: "center",
          }}
        >
          keepsy.store
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: tagOp,
            transform: `translateY(${tagY}px)`,
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 62,
            color: BRAND.white,
            lineHeight: 1.1,
            letterSpacing: "-1.5px",
            textAlign: "center",
          }}
        >
          Gifts they'll never forget.
        </div>
      </AbsoluteFill>

      {/* Wordmark — bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          zIndex: 5,
          opacity: wordmarkOp,
        }}
      >
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 52,
            color: BRAND.white,
            letterSpacing: "-1.5px",
          }}
        >
          Keepsy
        </div>
      </div>
    </AbsoluteFill>
  );
};
