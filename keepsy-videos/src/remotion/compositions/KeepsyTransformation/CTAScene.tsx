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

  // Forest green background wipes in from bottom (0–25 frames)
  const bgWipe = interpolate(frame, [0, 25], [100, 0], clamp);

  // "Your photo." springs in
  const line1Spring = spring({
    frame: Math.max(0, frame - 20),
    fps,
    config: { damping: 220, stiffness: 160, mass: 0.7 },
    from: 0,
    to: 1,
  });
  const line1Scale   = interpolate(line1Spring, [0, 1], [0.75, 1]);
  const line1Opacity = interpolate(line1Spring, [0, 1], [0, 1]);

  // "Your masterpiece." springs in with slight delay
  const line2Spring = spring({
    frame: Math.max(0, frame - 32),
    fps,
    config: { damping: 220, stiffness: 160, mass: 0.7 },
    from: 0,
    to: 1,
  });
  const line2Scale   = interpolate(line2Spring, [0, 1], [0.75, 1]);
  const line2Opacity = interpolate(line2Spring, [0, 1], [0, 1]);

  // URL line fades in
  const urlOpacity = interpolate(frame, [52, 75], [0, 1], clamp);

  // Terracotta accent line grows
  const accentWidth = interpolate(frame, [58, 100], [0, 200], clamp);

  // Keepsy wordmark fades in at bottom
  const wordmarkOpacity = interpolate(frame, [70, 100], [0, 1], clamp);

  // Sparkle dots around the main text
  const sparkleOpacity = interpolate(frame, [60, 90], [0, 1], clamp);
  const sparkles = [
    { x: 80,  y: 500, size: 9,  phase: 0.0 },
    { x: 980, y: 460, size: 7,  phase: 1.4 },
    { x: 60,  y: 750, size: 8,  phase: 2.7 },
    { x: 960, y: 700, size: 6,  phase: 0.8 },
    { x: 520, y: 350, size: 7,  phase: 2.1 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.cream }}>
      {/* Forest green background — wipes in from bottom */}
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

      {/* Gold sparkle accents */}
      {sparkles.map((s, i) => {
        const pulse = Math.abs(Math.sin(frame * 0.10 + s.phase));
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
              opacity: sparkleOpacity * (0.3 + 0.6 * pulse),
              transform: `scale(${0.5 + 0.6 * pulse})`,
              zIndex: 10,
            }}
          />
        );
      })}

      {/* Content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px",
          zIndex: 5,
        }}
      >
        {/* "Your photo." */}
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 108,
            color: BRAND.white,
            lineHeight: 1.0,
            letterSpacing: "-3px",
            textAlign: "center",
            opacity: line1Opacity,
            transform: `scale(${line1Scale})`,
            transformOrigin: "center center",
          }}
        >
          Your photo.
        </div>

        {/* "Your masterpiece." */}
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 108,
            color: BRAND.gold,
            lineHeight: 1.05,
            letterSpacing: "-3px",
            textAlign: "center",
            opacity: line2Opacity,
            transform: `scale(${line2Scale})`,
            transformOrigin: "center center",
            marginBottom: 56,
          }}
        >
          Your masterpiece.
        </div>

        {/* Terracotta accent line */}
        <div
          style={{
            width: accentWidth,
            height: 4,
            backgroundColor: BRAND.terracotta,
            borderRadius: 2,
            marginBottom: 44,
          }}
        />

        {/* URL */}
        <div
          style={{
            fontFamily: MANROPE,
            fontWeight: 600,
            fontSize: 48,
            color: BRAND.terracotta,
            letterSpacing: "0.5px",
            opacity: urlOpacity,
            marginBottom: 0,
          }}
        >
          keepsy.store
        </div>
      </div>

      {/* Keepsy wordmark — bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: wordmarkOpacity,
          zIndex: 5,
        }}
      >
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 52,
            color: BRAND.white,
            letterSpacing: "-1.5px",
            opacity: 0.55,
          }}
        >
          Keepsy
        </div>
      </div>
    </AbsoluteFill>
  );
};
