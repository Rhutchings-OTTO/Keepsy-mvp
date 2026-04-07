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

  // ── "Still buying gift cards?" — fast punch-in ──
  const mainSpring = spring({
    frame,
    fps,
    config: { damping: 350, stiffness: 550, mass: 0.4 },
    from: 0,
    to: 1,
  });
  const mainScale   = interpolate(mainSpring, [0, 1], [0.65, 1]);
  const mainOpacity = interpolate(mainSpring, [0, 0.5], [0, 1], clamp);

  // ── "Really?" — fades in after a 0.5s beat ──
  const reallyStart = 30; // beat: 30fr pause after spring settles
  const reallySpring = spring({
    frame: Math.max(0, frame - reallyStart),
    fps,
    config: { damping: 200, stiffness: 140, mass: 0.9 },
    from: 0,
    to: 1,
  });
  const reallyOpacity = interpolate(reallySpring, [0, 1], [0, 1]);

  // ── Head-shake wobble on "Really?" — decaying oscillation ──
  const wobbleFrame = Math.max(0, frame - reallyStart);
  const decay       = Math.exp(-wobbleFrame * 0.055);
  const wobble      = Math.sin(wobbleFrame * 0.55) * decay * 18; // ±18px, decays

  // ── Small "?" bounces separately ──
  const questionScale = 1 + Math.abs(Math.sin(wobbleFrame * 0.55)) * decay * 0.25;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.cream,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 80px",
      }}
    >
      {/* Keepsy wordmark */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 64,
          fontFamily: FRAUNCES,
          fontWeight: 700,
          fontSize: 40,
          color: BRAND.ink,
          letterSpacing: "-1px",
          opacity: mainOpacity * 0.4,
        }}
      >
        Keepsy
      </div>

      {/* Main hook */}
      <div
        style={{
          opacity: mainOpacity,
          transform: `scale(${mainScale})`,
          transformOrigin: "center center",
          textAlign: "center",
          marginBottom: 40,
        }}
      >
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 88,
            color: BRAND.ink,
            lineHeight: 1.08,
            letterSpacing: "-2px",
          }}
        >
          Still buying gift cards?
        </div>
      </div>

      {/* "Really?" with head-shake */}
      <div
        style={{
          opacity: reallyOpacity,
          transform: `translateX(${wobble}px)`,
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 100,
            fontStyle: "italic",
            color: BRAND.terracotta,
            letterSpacing: "-2px",
            lineHeight: 1,
            transform: `scale(${questionScale})`,
            transformOrigin: "center center",
          }}
        >
          Really?
        </div>
      </div>

      {/* Subtle gold underline under main text */}
      <div
        style={{
          position: "absolute",
          bottom: 200,
          width: interpolate(frame, [22, 55], [0, 240], clamp),
          height: 4,
          backgroundColor: BRAND.gold,
          borderRadius: 2,
        }}
      />
    </AbsoluteFill>
  );
};
