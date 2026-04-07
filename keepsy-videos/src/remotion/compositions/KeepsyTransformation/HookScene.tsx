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

  // Keepsy wordmark fades in
  const wordmarkOpacity = interpolate(frame, [0, 12], [0, 1], clamp);

  // Three lines punch in with staggered fast springs
  const makeLineSpring = (delay: number) =>
    spring({
      frame: Math.max(0, frame - delay),
      fps,
      config: { damping: 400, stiffness: 600, mass: 0.4 },
      from: 0,
      to: 1,
    });

  const s1 = makeLineSpring(0);
  const s2 = makeLineSpring(6);
  const s3 = makeLineSpring(12);

  const lineStyle = (s: number) => ({
    opacity: s,
    transform: `scale(${interpolate(s, [0, 1], [0.72, 1])}) translateY(${interpolate(s, [0, 1], [36, 0])}px)`,
    display: "block",
  });

  // Gold accent line grows in
  const accentWidth = interpolate(frame, [22, 55], [0, 220], clamp);

  // Subtitle fades in
  const subtitleOpacity = interpolate(frame, [30, 60], [0, 1], clamp);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.cream,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Keepsy wordmark — top-left */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 64,
          opacity: wordmarkOpacity,
          fontFamily: FRAUNCES,
          fontWeight: 700,
          fontSize: 40,
          color: BRAND.ink,
          letterSpacing: "-1px",
        }}
      >
        Keepsy
      </div>

      {/* Main hook text */}
      <div style={{ padding: "0 80px", textAlign: "center" }}>
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 96,
            color: BRAND.ink,
            lineHeight: 1.05,
            letterSpacing: "-2.5px",
          }}
        >
          <span style={lineStyle(s1)}>Watch this</span>
          <span style={lineStyle(s2)}>photo become</span>
          <span style={{ ...lineStyle(s3), color: BRAND.terracotta }}>
            a masterpiece
          </span>
        </div>

        {/* Gold accent line */}
        <div
          style={{
            width: accentWidth,
            height: 4,
            backgroundColor: BRAND.gold,
            borderRadius: 2,
            margin: "36px auto 0",
          }}
        />

        {/* Subtle subtext */}
        <div
          style={{
            fontFamily: MANROPE,
            fontWeight: 500,
            fontSize: 34,
            color: BRAND.ink,
            opacity: subtitleOpacity * 0.55,
            marginTop: 28,
            letterSpacing: "-0.2px",
          }}
        >
          Personalised gifts, beautifully made
        </div>
      </div>
    </AbsoluteFill>
  );
};
