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

const LINE_FRAMES = 60; // 2s per line
const FLASH_DURATION = 5;

// ── CSS icons ──────────────────────────────────────────────────────────────────

// Flame / candle
const CandleIcon: React.FC = () => (
  <div style={{ position: "relative", width: 44, height: 54, display: "flex", flexDirection: "column", alignItems: "center" }}>
    {/* Flame */}
    <div style={{
      width: 16,
      height: 20,
      backgroundColor: BRAND.gold,
      borderRadius: "50% 50% 40% 40% / 60% 60% 40% 40%",
      marginBottom: 2,
    }} />
    {/* Wick */}
    <div style={{ width: 2, height: 6, backgroundColor: BRAND.ink, opacity: 0.5 }} />
    {/* Candle body */}
    <div style={{
      width: 22,
      height: 28,
      backgroundColor: BRAND.white,
      borderRadius: "2px 2px 4px 4px",
      border: `2px solid rgba(0,0,0,0.12)`,
    }} />
  </div>
);

// Sock
const SockIcon: React.FC = () => (
  <div style={{ position: "relative", width: 50, height: 50 }}>
    {/* Leg */}
    <div style={{
      position: "absolute",
      top: 0,
      left: 14,
      width: 20,
      height: 32,
      backgroundColor: BRAND.forest,
      borderRadius: "10px 10px 0 0",
    }} />
    {/* Cuff stripe */}
    <div style={{
      position: "absolute",
      top: 6,
      left: 14,
      width: 20,
      height: 5,
      backgroundColor: BRAND.terracotta,
    }} />
    {/* Foot */}
    <div style={{
      position: "absolute",
      bottom: 0,
      left: 6,
      width: 34,
      height: 18,
      backgroundColor: BRAND.forest,
      borderRadius: "0 0 16px 6px",
    }} />
  </div>
);

// Voucher / ticket
const VoucherIcon: React.FC = () => (
  <div style={{ position: "relative", width: 54, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>
    {/* Card body */}
    <div style={{
      width: 50,
      height: 30,
      border: `3px solid ${BRAND.ink}`,
      borderRadius: 6,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    }}>
      {/* £ symbol lines */}
      <div style={{ width: 14, height: 2, backgroundColor: BRAND.ink, borderRadius: 1 }} />
      <div style={{ width: 8, height: 2, backgroundColor: BRAND.ink, borderRadius: 1 }} />
    </div>
    {/* Notch left */}
    <div style={{
      position: "absolute",
      left: -1,
      width: 10,
      height: 10,
      borderRadius: "50%",
      backgroundColor: BRAND.cream,
      border: `3px solid ${BRAND.ink}`,
    }} />
    {/* Notch right */}
    <div style={{
      position: "absolute",
      right: -1,
      width: 10,
      height: 10,
      borderRadius: "50%",
      backgroundColor: BRAND.cream,
      border: `3px solid ${BRAND.ink}`,
    }} />
  </div>
);

const LINES = [
  {
    text: "A candle from the petrol station?",
    font: MANROPE,
    weight: 500,
    size: 62,
    Icon: CandleIcon,
    bgColor: BRAND.cream,
    textColor: BRAND.ink,
  },
  {
    text: "Socks. Again.",
    font: FRAUNCES,
    weight: 700,
    size: 88,
    Icon: SockIcon,
    bgColor: BRAND.creamDark,
    textColor: BRAND.ink,
  },
  {
    text: "A voucher with £10 on it?",
    font: MANROPE,
    weight: 500,
    size: 62,
    Icon: VoucherIcon,
    bgColor: BRAND.cream,
    textColor: BRAND.ink,
  },
] as const;

export const RoastScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lineIndex = Math.min(LINES.length - 1, Math.floor(frame / LINE_FRAMES));
  const localFrame = frame % LINE_FRAMES;

  // Terracotta flash at line boundaries
  const flashOpacity =
    (frame >= LINE_FRAMES - FLASH_DURATION && frame < LINE_FRAMES + FLASH_DURATION) ||
    (frame >= 2 * LINE_FRAMES - FLASH_DURATION && frame < 2 * LINE_FRAMES + FLASH_DURATION)
      ? interpolate(
          frame % LINE_FRAMES,
          [LINE_FRAMES - FLASH_DURATION, LINE_FRAMES - 1],
          [0, 0.9],
          clamp
        )
      : 0;

  const line = LINES[lineIndex];
  const Icon = line.Icon;

  // Slide up from bottom
  const enterSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 220, stiffness: 200, mass: 0.6 },
    from: 0,
    to: 1,
  });
  const slideY  = interpolate(enterSpring, [0, 1], [220, 0]);
  const opacity = interpolate(enterSpring, [0, 0.4], [0, 1], clamp);

  // Icon pops in slightly after text
  const iconSpring = spring({
    frame: Math.max(0, localFrame - 8),
    fps,
    config: { damping: 160, stiffness: 260, mass: 0.5 },
    from: 0,
    to: 1,
  });
  const iconScale = interpolate(iconSpring, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: line.bgColor }}>
      {/* Center content */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 72px",
          gap: 36,
        }}
      >
        {/* Icon */}
        <div style={{ transform: `scale(${iconScale})` }}>
          <Icon />
        </div>

        {/* Text */}
        <div
          style={{
            opacity,
            transform: `translateY(${slideY}px)`,
            textAlign: "center",
            fontFamily: line.font,
            fontWeight: line.weight,
            fontSize: line.size,
            color: line.textColor,
            lineHeight: 1.1,
            letterSpacing: line.font === FRAUNCES ? "-2px" : "-1px",
          }}
        >
          {line.text}
        </div>

        {/* Terracotta underline grows in */}
        <div
          style={{
            width: interpolate(localFrame, [12, 45], [0, 200], clamp),
            height: 4,
            backgroundColor: BRAND.terracotta,
            borderRadius: 2,
          }}
        />
      </AbsoluteFill>

      {/* Flash overlay at transitions */}
      {flashOpacity > 0 && (
        <AbsoluteFill
          style={{
            backgroundColor: BRAND.terracotta,
            opacity: flashOpacity,
          }}
        />
      )}
    </AbsoluteFill>
  );
};
