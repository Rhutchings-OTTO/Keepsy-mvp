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

export const LogoIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo spring: enters at frame 0
  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 180, stiffness: 110, mass: 0.8 },
    from: 0,
    to: 1,
  });
  const logoScale = interpolate(logoSpring, [0, 1], [0.65, 1]);
  const logoOpacity = interpolate(logoSpring, [0, 1], [0, 1]);

  // Gold underline grows with the logo
  const underlineWidth = interpolate(logoSpring, [0, 1], [0, 140]);

  // Tagline: delayed spring from frame 18
  const taglineSpring = spring({
    frame: Math.max(0, frame - 18),
    fps,
    config: { damping: 200, stiffness: 100, mass: 0.9 },
    from: 0,
    to: 1,
  });
  const taglineOpacity = interpolate(taglineSpring, [0, 1], [0, 1]);
  const taglineY = interpolate(taglineSpring, [0, 1], [32, 0]);

  // Gold sparkles: staggered
  const sparkles = [
    { x: 430, y: 785, size: 8, phase: 0 },
    { x: 618, y: 760, size: 5, phase: 1.1 },
    { x: 560, y: 835, size: 6, phase: 2.2 },
    { x: 478, y: 862, size: 4, phase: 0.7 },
    { x: 634, y: 818, size: 7, phase: 1.8 },
    { x: 502, y: 740, size: 5, phase: 3.0 },
  ];

  const sparkleBaseOpacity = interpolate(frame, [8, 22], [0, 1], clamp);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.cream,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      {/* Gold sparkle dots */}
      {sparkles.map((dot, i) => {
        const pulse = Math.abs(
          Math.sin(frame * 0.13 + dot.phase)
        );
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: dot.size,
              height: dot.size,
              borderRadius: "50%",
              backgroundColor: BRAND.gold,
              left: dot.x,
              top: dot.y,
              opacity: sparkleBaseOpacity * (0.3 + 0.5 * pulse),
              transform: `scale(${0.6 + 0.4 * pulse})`,
            }}
          />
        );
      })}

      {/* Keepsy wordmark */}
      <div
        style={{
          fontFamily: FRAUNCES,
          fontWeight: 700,
          fontSize: 168,
          color: BRAND.ink,
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          transformOrigin: "center center",
          letterSpacing: "-5px",
          lineHeight: 1,
          paddingBottom: 28,
        }}
      >
        Keepsy
      </div>

      {/* Gold accent line beneath wordmark */}
      <div
        style={{
          width: underlineWidth,
          height: 4,
          backgroundColor: BRAND.gold,
          borderRadius: 2,
          marginTop: 4,
          opacity: logoOpacity,
        }}
      />

      {/* Tagline */}
      <div
        style={{
          fontFamily: MANROPE,
          fontWeight: 500,
          fontSize: 42,
          color: BRAND.ink,
          opacity: taglineOpacity * 0.72,
          transform: `translateY(${taglineY}px)`,
          textAlign: "center",
          letterSpacing: "-0.3px",
          lineHeight: 1.45,
          maxWidth: 780,
          marginTop: 48,
          padding: "0 60px",
        }}
      >
        Personalised gifts they'll treasure forever
      </div>
    </AbsoluteFill>
  );
};
