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

const BULLET_STARTS = [15, 45, 75] as const;

const BULLETS = [
  "Upload any photo — we'll do the rest",
  "Choose from mugs, canvases, hoodies & more",
  "Delivered in days. Loved forever.",
] as const;

interface BulletRowProps {
  text: string;
  startFrame: number;
  frame: number;
  fps: number;
}

const BulletRow: React.FC<BulletRowProps> = ({ text, startFrame, frame, fps }) => {
  const s = spring({
    frame: Math.max(0, frame - startFrame),
    fps,
    config: { damping: 200, stiffness: 150, mass: 0.75 },
    from: 0,
    to: 1,
  });
  const slideX  = interpolate(s, [0, 1], [80, 0]);
  const opacity = interpolate(s, [0, 0.5], [0, 1], clamp);

  // Terracotta dot pops in
  const dotSpring = spring({
    frame: Math.max(0, frame - startFrame),
    fps,
    config: { damping: 140, stiffness: 300, mass: 0.45 },
    from: 0,
    to: 1,
  });
  const dotScale = interpolate(dotSpring, [0, 1], [0, 1]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 28,
        opacity,
        transform: `translateX(${slideX}px)`,
      }}
    >
      {/* Terracotta dot */}
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          backgroundColor: BRAND.terracotta,
          flexShrink: 0,
          transform: `scale(${dotScale})`,
        }}
      />
      <div
        style={{
          fontFamily: MANROPE,
          fontWeight: 500,
          fontSize: 46,
          color: BRAND.ink,
          lineHeight: 1.2,
          letterSpacing: "-0.5px",
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const TeaseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Header springs in
  const headerSpring = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { damping: 200, stiffness: 130, mass: 0.8 },
    from: 0,
    to: 1,
  });
  const headerY  = interpolate(headerSpring, [0, 1], [30, 0]);
  const headerOp = interpolate(headerSpring, [0, 1], [0, 1]);
  const accentW  = interpolate(frame, [10, 40], [0, 180], clamp);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.creamDark,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "0 80px",
      }}
    >
      {/* Header */}
      <div
        style={{
          opacity: headerOp,
          transform: `translateY(${headerY}px)`,
          marginBottom: 60,
        }}
      >
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 80,
            color: BRAND.ink,
            lineHeight: 1.05,
            letterSpacing: "-2px",
            marginBottom: 16,
          }}
        >
          Here's how it works.
        </div>
        <div
          style={{
            width: accentW,
            height: 4,
            backgroundColor: BRAND.gold,
            borderRadius: 2,
          }}
        />
      </div>

      {/* Bullets */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 44,
          width: "100%",
        }}
      >
        {BULLETS.map((text, i) => (
          <BulletRow
            key={i}
            text={text}
            startFrame={BULLET_STARTS[i]}
            frame={frame}
            fps={fps}
          />
        ))}
      </div>

      {/* Keepsy wordmark — bottom left */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 80,
          fontFamily: FRAUNCES,
          fontWeight: 700,
          fontSize: 38,
          color: BRAND.ink,
          letterSpacing: "-1px",
          opacity: interpolate(frame, [85, 105], [0, 0.35], clamp),
        }}
      >
        Keepsy
      </div>
    </AbsoluteFill>
  );
};
