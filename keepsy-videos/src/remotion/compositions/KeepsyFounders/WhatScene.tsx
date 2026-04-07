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

// ── CSS Icons inside terracotta circles ───────────────────────────────────────

const CameraIcon: React.FC = () => (
  <div style={{ position: "relative", width: 44, height: 38, display: "flex", alignItems: "center", justifyContent: "center" }}>
    {/* Body */}
    <div style={{
      position: "absolute",
      bottom: 0,
      width: 40,
      height: 28,
      border: "3px solid rgba(255,254,249,0.9)",
      borderRadius: 6,
    }} />
    {/* Lens */}
    <div style={{
      position: "absolute",
      bottom: 6,
      width: 16,
      height: 16,
      borderRadius: "50%",
      border: "3px solid rgba(255,254,249,0.9)",
    }} />
    {/* Viewfinder bump */}
    <div style={{
      position: "absolute",
      top: 0,
      left: 6,
      width: 14,
      height: 10,
      border: "3px solid rgba(255,254,249,0.9)",
      borderRadius: "4px 4px 0 0",
      borderBottom: "none",
    }} />
  </div>
);

const BrushIcon: React.FC = () => (
  <div style={{ position: "relative", width: 40, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
    {/* Handle */}
    <div style={{
      width: 6,
      height: 28,
      backgroundColor: "rgba(255,254,249,0.9)",
      borderRadius: 3,
      transform: "rotate(-30deg)",
      position: "absolute",
    }} />
    {/* Bristle head */}
    <div style={{
      width: 10,
      height: 12,
      backgroundColor: "rgba(255,254,249,0.85)",
      borderRadius: "3px 3px 8px 8px",
      transform: "rotate(-30deg)",
      position: "absolute",
      top: 2,
      left: 7,
    }} />
  </div>
);

const GiftIcon: React.FC = () => (
  <div style={{ position: "relative", width: 42, height: 42, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
    {/* Box body */}
    <div style={{
      width: 36,
      height: 24,
      border: "3px solid rgba(255,254,249,0.9)",
      borderRadius: "0 0 5px 5px",
      position: "absolute",
      bottom: 0,
    }} />
    {/* Lid */}
    <div style={{
      position: "absolute",
      top: 8,
      left: 0,
      right: 0,
      height: 12,
      border: "3px solid rgba(255,254,249,0.9)",
      borderRadius: "4px 4px 0 0",
      borderBottom: "none",
    }} />
    {/* Ribbon vertical */}
    <div style={{
      position: "absolute",
      top: 8,
      left: "50%",
      width: 3,
      height: 28,
      backgroundColor: "rgba(255,254,249,0.6)",
      transform: "translateX(-50%)",
    }} />
    {/* Bow left */}
    <div style={{
      position: "absolute",
      top: 0,
      left: 8,
      width: 10,
      height: 10,
      border: "3px solid rgba(255,254,249,0.9)",
      borderRadius: "50%",
    }} />
    {/* Bow right */}
    <div style={{
      position: "absolute",
      top: 0,
      right: 8,
      width: 10,
      height: 10,
      border: "3px solid rgba(255,254,249,0.9)",
      borderRadius: "50%",
    }} />
  </div>
);

const POINTS = [
  { Icon: CameraIcon, text: "Upload a photo or describe a memory",  start: 50  },
  { Icon: BrushIcon,  text: "Watch it become something beautiful",   start: 105 },
  { Icon: GiftIcon,   text: "Give a gift they'll keep forever",       start: 158 },
] as const;

interface PointRowProps {
  Icon: React.FC;
  text: string;
  startFrame: number;
  frame: number;
  fps: number;
}

const PointRow: React.FC<PointRowProps> = ({ Icon, text, startFrame, frame, fps }) => {
  const s = spring({
    frame: Math.max(0, frame - startFrame),
    fps,
    config: { damping: 200, stiffness: 120, mass: 0.85 },
    from: 0,
    to: 1,
  });
  const slideX  = interpolate(s, [0, 1], [70, 0]);
  const opacity = interpolate(s, [0, 0.6], [0, 1], clamp);

  const circleSpring = spring({
    frame: Math.max(0, frame - startFrame),
    fps,
    config: { damping: 160, stiffness: 200, mass: 0.6 },
    from: 0,
    to: 1,
  });
  const circleScale = interpolate(circleSpring, [0, 1], [0, 1]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 32,
        opacity,
        transform: `translateX(${slideX}px)`,
      }}
    >
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: "50%",
          backgroundColor: BRAND.terracotta,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${circleScale})`,
        }}
      >
        <Icon />
      </div>
      <div
        style={{
          fontFamily: MANROPE,
          fontWeight: 500,
          fontSize: 40,
          color: BRAND.white,
          lineHeight: 1.3,
          letterSpacing: "-0.3px",
          flex: 1,
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const WhatScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Forest green wipes up from bottom
  const bgWipe = interpolate(frame, [0, 22], [100, 0], clamp);

  // Header fades in
  const headerOp = interpolate(frame, [18, 40], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.creamDark }}>
      {/* Green wipes up */}
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

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "0 80px",
          gap: 48,
          zIndex: 5,
        }}
      >
        {/* Header */}
        <div
          style={{
            opacity: headerOp * 0.7,
            fontFamily: MANROPE,
            fontWeight: 500,
            fontSize: 40,
            color: BRAND.white,
            letterSpacing: "-0.3px",
          }}
        >
          A place where you can...
        </div>

        {/* Value points */}
        {POINTS.map((p, i) => (
          <PointRow
            key={i}
            Icon={p.Icon}
            text={p.text}
            startFrame={p.start}
            frame={frame}
            fps={fps}
          />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
