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

  // Background fills in from bottom (0–20 frames)
  const bgWipe = interpolate(frame, [0, 20], [100, 0], clamp);

  const makeSpring = (delay: number) =>
    spring({
      frame: Math.max(0, frame - delay),
      fps,
      config: { damping: 200, stiffness: 150, mass: 0.75 },
      from: 0,
      to: 1,
    });

  // Staggered spring entrances
  const s1 = makeSpring(18);  // "The gift..."
  const s2 = makeSpring(30);  // "they'll never forget"
  const s3 = makeSpring(50);  // "From just £6.99"
  const s4 = makeSpring(68);  // "keepsy.store"
  const s5 = makeSpring(85);  // Keepsy wordmark

  const toStyle = (s: ReturnType<typeof makeSpring>, scale = false) => ({
    opacity: interpolate(s, [0, 1], [0, 1]),
    transform: scale
      ? `scale(${interpolate(s, [0, 1], [0.82, 1])})`
      : `translateY(${interpolate(s, [0, 1], [32, 0])}px)`,
  });

  // Terracotta accent line
  const accentWidth = interpolate(frame, [55, 95], [0, 180], clamp);

  // Gold sparkles
  const sparkleOpacity = interpolate(frame, [60, 90], [0, 1], clamp);
  const sparkles = [
    { x: 80,  y: 480, size: 9,  phase: 0.0 },
    { x: 970, y: 440, size: 7,  phase: 1.5 },
    { x: 65,  y: 720, size: 8,  phase: 2.8 },
    { x: 950, y: 680, size: 6,  phase: 0.9 },
    { x: 510, y: 340, size: 7,  phase: 2.2 },
    { x: 200, y: 900, size: 5,  phase: 1.1 },
    { x: 840, y: 910, size: 6,  phase: 3.0 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.cream }}>
      {/* Forest green background — wipes up from bottom */}
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

      {/* Gold sparkles */}
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
              opacity: sparkleOpacity * (0.28 + 0.62 * pulse),
              transform: `scale(${0.5 + 0.6 * pulse})`,
              zIndex: 10,
            }}
          />
        );
      })}

      {/* Main content */}
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
        {/* Line 1 */}
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 96,
            color: BRAND.white,
            lineHeight: 1.0,
            letterSpacing: "-2.5px",
            textAlign: "center",
            ...toStyle(s1, true),
          }}
        >
          The gift they'll
        </div>

        {/* Line 2 */}
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 96,
            color: BRAND.gold,
            lineHeight: 1.05,
            letterSpacing: "-2.5px",
            textAlign: "center",
            marginBottom: 52,
            ...toStyle(s2, true),
          }}
        >
          never forget
        </div>

        {/* Accent line */}
        <div
          style={{
            width: accentWidth,
            height: 4,
            backgroundColor: BRAND.terracotta,
            borderRadius: 2,
            marginBottom: 44,
          }}
        />

        {/* Price */}
        <div
          style={{
            fontFamily: MANROPE,
            fontWeight: 700,
            fontSize: 52,
            color: BRAND.gold,
            letterSpacing: "-0.5px",
            marginBottom: 24,
            ...toStyle(s3),
          }}
        >
          From just £6.99
        </div>

        {/* URL */}
        <div
          style={{
            fontFamily: MANROPE,
            fontWeight: 600,
            fontSize: 48,
            color: BRAND.terracotta,
            letterSpacing: "0.5px",
            ...toStyle(s4),
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
          zIndex: 5,
          ...toStyle(s5),
        }}
      >
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 52,
            color: BRAND.white,
            letterSpacing: "-1.5px",
            opacity: 0.5,
          }}
        >
          Keepsy
        </div>
      </div>
    </AbsoluteFill>
  );
};
