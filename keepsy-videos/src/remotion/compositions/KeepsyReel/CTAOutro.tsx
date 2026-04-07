import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND, FRAUNCES, MANROPE } from "./fonts";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const CTAOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background sweeps down from the top (forest green paint)
  const bgProgress = interpolate(frame, [0, 18], [0, 1], clamp);

  // "Create yours today" springs in
  const headlineSpring = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 180, stiffness: 120, mass: 0.8 },
    from: 0,
    to: 1,
  });
  const headlineScale = interpolate(headlineSpring, [0, 1], [0.7, 1]);
  const headlineOpacity = interpolate(headlineSpring, [0, 1], [0, 1]);

  // URL fades in
  const urlOpacity = interpolate(frame, [25, 45], [0, 1], clamp);
  const urlY = interpolate(frame, [25, 45], [24, 0], clamp);

  // Keepsy wordmark at bottom fades in
  const wordmarkOpacity = interpolate(frame, [38, 58], [0, 1], clamp);
  const wordmarkY = interpolate(frame, [38, 58], [20, 0], clamp);

  // Terracotta accent line grows from centre
  const lineWidth = interpolate(frame, [20, 50], [0, 220], clamp);
  const lineOpacity = interpolate(frame, [20, 32], [0, 1], clamp);

  // Decorative terracotta arc (top-right corner shimmer)
  const arcOpacity = interpolate(frame, [15, 35], [0, 1], clamp);
  const arcScale = interpolate(frame, [15, 40], [0.5, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.forest }}>
      {/* Background fill animation — forest green reveals from top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: `${bgProgress * 100}%`,
          backgroundColor: BRAND.forest,
          zIndex: 1,
        }}
      />

      {/* Decorative arcs (top corners) */}
      <div
        style={{
          position: "absolute",
          top: -120,
          right: -120,
          width: 400,
          height: 400,
          borderRadius: "50%",
          border: `3px solid ${BRAND.terracotta}`,
          opacity: arcOpacity * 0.35,
          transform: `scale(${arcScale})`,
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -80,
          left: -80,
          width: 280,
          height: 280,
          borderRadius: "50%",
          border: `2px solid ${BRAND.gold}`,
          opacity: arcOpacity * 0.25,
          transform: `scale(${arcScale})`,
          zIndex: 2,
        }}
      />

      {/* Main content */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 5,
          padding: "0 80px",
          gap: 0,
        }}
      >
        {/* "Create yours today" */}
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 110,
            color: BRAND.white,
            textAlign: "center",
            lineHeight: 1.0,
            letterSpacing: "-2.5px",
            opacity: headlineOpacity,
            transform: `scale(${headlineScale})`,
            transformOrigin: "center center",
            marginBottom: 0,
          }}
        >
          Create yours
        </div>
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 110,
            color: BRAND.white,
            textAlign: "center",
            lineHeight: 1.0,
            letterSpacing: "-2.5px",
            opacity: headlineOpacity,
            transform: `scale(${headlineScale})`,
            transformOrigin: "center center",
            marginBottom: 48,
          }}
        >
          today
        </div>

        {/* Terracotta accent line */}
        <div
          style={{
            width: lineWidth,
            height: 4,
            backgroundColor: BRAND.terracotta,
            borderRadius: 2,
            opacity: lineOpacity,
            marginBottom: 48,
          }}
        />

        {/* keepsy.store URL */}
        <div
          style={{
            fontFamily: MANROPE,
            fontWeight: 600,
            fontSize: 56,
            color: BRAND.terracotta,
            letterSpacing: "0.5px",
            opacity: urlOpacity,
            transform: `translateY(${urlY}px)`,
            marginBottom: 80,
          }}
        >
          keepsy.store
        </div>

        {/* Keepsy wordmark */}
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 72,
            color: BRAND.white,
            letterSpacing: "-2px",
            opacity: wordmarkOpacity,
            transform: `translateY(${wordmarkY}px)`,
          }}
        >
          Keepsy
        </div>

        {/* Gold underline under wordmark */}
        <div
          style={{
            width: interpolate(frame, [42, 62], [0, 70], clamp),
            height: 3,
            backgroundColor: BRAND.gold,
            borderRadius: 2,
            marginTop: 6,
            opacity: wordmarkOpacity,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
