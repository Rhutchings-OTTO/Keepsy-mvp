import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND, FRAUNCES } from "../KeepsyReel/fonts";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const VALUE_FRAMES = 30; // ~1s per value

// ── CSS Icons ─────────────────────────────────────────────────────────────────

// 4-pointed star from two rotated rectangles
const StarIcon: React.FC = () => (
  <div style={{ position: "relative", width: 40, height: 40 }}>
    <div style={{
      position: "absolute",
      inset: 0,
      width: 10,
      height: 40,
      backgroundColor: BRAND.white,
      borderRadius: 5,
      left: 15,
    }} />
    <div style={{
      position: "absolute",
      inset: 0,
      width: 40,
      height: 10,
      backgroundColor: BRAND.white,
      borderRadius: 5,
      top: 15,
    }} />
    <div style={{
      position: "absolute",
      width: 8,
      height: 32,
      backgroundColor: BRAND.white,
      borderRadius: 4,
      left: 16,
      top: 4,
      transform: "rotate(45deg)",
    }} />
    <div style={{
      position: "absolute",
      width: 8,
      height: 32,
      backgroundColor: BRAND.white,
      borderRadius: 4,
      left: 16,
      top: 4,
      transform: "rotate(-45deg)",
    }} />
  </div>
);

// 4-pointed sparkle (elongated diamond cross)
const SparkleIcon: React.FC = () => (
  <div style={{ position: "relative", width: 40, height: 40 }}>
    {/* Tall point */}
    <div style={{
      position: "absolute",
      width: 8,
      height: 40,
      backgroundColor: BRAND.white,
      borderRadius: 4,
      left: 16,
      top: 0,
      clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
    }} />
    {/* Wide point */}
    <div style={{
      position: "absolute",
      width: 40,
      height: 8,
      backgroundColor: BRAND.white,
      borderRadius: 4,
      top: 16,
      left: 0,
      clipPath: "polygon(0% 50%, 50% 0%, 100% 50%, 50% 100%)",
    }} />
  </div>
);

// Simple heart: two circles + rotated square
const HeartIcon: React.FC = () => (
  <div style={{ position: "relative", width: 40, height: 36 }}>
    <div style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: 22,
      height: 22,
      borderRadius: "50%",
      backgroundColor: BRAND.white,
    }} />
    <div style={{
      position: "absolute",
      top: 0,
      right: 0,
      width: 22,
      height: 22,
      borderRadius: "50%",
      backgroundColor: BRAND.white,
    }} />
    <div style={{
      position: "absolute",
      top: 10,
      left: 3,
      width: 26,
      height: 26,
      backgroundColor: BRAND.white,
      transform: "rotate(45deg)",
      borderRadius: 3,
    }} />
  </div>
);

// Leaf: oval rotated 45deg
const LeafIcon: React.FC = () => (
  <div style={{ position: "relative", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{
      width: 28,
      height: 40,
      backgroundColor: BRAND.white,
      borderRadius: "50% 0 50% 0",
      transform: "rotate(45deg)",
    }} />
    {/* Stem */}
    <div style={{
      position: "absolute",
      bottom: 0,
      left: "50%",
      width: 3,
      height: 12,
      backgroundColor: "rgba(255,254,249,0.7)",
      borderRadius: 2,
      transform: "translateX(-50%)",
    }} />
  </div>
);

const VALUES = [
  { Icon: StarIcon,    label: "Quality First"          },
  { Icon: SparkleIcon, label: "Effortlessly Personal"  },
  { Icon: HeartIcon,   label: "Made with Intention"    },
  { Icon: LeafIcon,    label: "Planet-Conscious"        },
] as const;

export const ValuesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const valueIndex  = Math.min(VALUES.length - 1, Math.floor(frame / VALUE_FRAMES));
  const localFrame  = frame % VALUE_FRAMES;
  const value       = VALUES[valueIndex];
  const Icon        = value.Icon;

  // Pop in
  const popSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 280, mass: 0.5 },
    from: 0,
    to: 1,
  });
  const scale  = interpolate(popSpring, [0, 1], [0.6, 1]);
  const opacity = interpolate(popSpring, [0, 0.4], [0, 1], clamp);

  // Fade out toward end (except last)
  const isLast = valueIndex === VALUES.length - 1;
  const fadeOut = isLast ? 1 : interpolate(localFrame, [VALUE_FRAMES - 10, VALUE_FRAMES], [1, 0], clamp);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.cream,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
      }}
    >
      <div
        key={valueIndex}
        style={{
          opacity: opacity * fadeOut,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
        }}
      >
        {/* Terracotta circle */}
        <div
          style={{
            width: 110,
            height: 110,
            borderRadius: "50%",
            backgroundColor: BRAND.terracotta,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon />
        </div>

        {/* Label */}
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 600,
            fontSize: 72,
            color: BRAND.ink,
            lineHeight: 1.05,
            letterSpacing: "-1.8px",
            textAlign: "center",
          }}
        >
          {value.label}
        </div>
      </div>
    </AbsoluteFill>
  );
};
