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

// Blink: eye height collapses to ~0 then reopens
// Blink starts at frame 28, takes ~10 frames
const BLINK_START = 28;
const BLINK_MID   = 33;
const BLINK_END   = 38;

interface EyeProps {
  frame: number;
  fps: number;
  delay?: number;
}

const Eye: React.FC<EyeProps> = ({ frame, fps, delay = 0 }) => {
  const f = Math.max(0, frame - delay);

  // Pop in
  const popSpring = spring({
    frame: f,
    fps,
    config: { damping: 140, stiffness: 320, mass: 0.45 },
    from: 0,
    to: 1,
  });
  const scale = interpolate(popSpring, [0, 1], [0, 1]);

  // Blink — eye scaleY: 1 → 0 → 1
  const blinkF = frame - BLINK_START;
  const eyeScaleY =
    frame < BLINK_START
      ? 1
      : frame < BLINK_MID
      ? interpolate(blinkF, [0, BLINK_MID - BLINK_START], [1, 0.05], clamp)
      : frame < BLINK_END
      ? interpolate(blinkF, [BLINK_MID - BLINK_START, BLINK_END - BLINK_START], [0.05, 1], clamp)
      : 1;

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        width: 72,
        height: 72,
        borderRadius: "50%",
        backgroundColor: BRAND.terracotta,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {/* Iris */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          backgroundColor: BRAND.terracotta,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scaleY(${eyeScaleY})`,
          transformOrigin: "center center",
        }}
      >
        {/* Pupil */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            backgroundColor: BRAND.ink,
          }}
        />
        {/* Highlight */}
        <div
          style={{
            position: "absolute",
            width: 9,
            height: 9,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.55)",
            top: 14,
            right: 14,
          }}
        />
      </div>
    </div>
  );
};

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // "Pop quiz" punches in fast
  const textSpring = spring({
    frame,
    fps,
    config: { damping: 320, stiffness: 500, mass: 0.38 },
    from: 0,
    to: 1,
  });
  const textScale   = interpolate(textSpring, [0, 1], [0.6, 1]);
  const textOpacity = interpolate(textSpring, [0, 0.5], [0, 1], clamp);

  // Subtitle fades in after a beat
  const subtitleOp = interpolate(frame, [28, 48], [0, 1], clamp);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.cream,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 72px",
        gap: 32,
      }}
    >
      {/* "Pop quiz" + eyes */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 28,
          opacity: textOpacity,
          transform: `scale(${textScale})`,
          transformOrigin: "center center",
        }}
      >
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 96,
            color: BRAND.ink,
            lineHeight: 1,
            letterSpacing: "-2.5px",
          }}
        >
          Pop quiz
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <Eye frame={frame} fps={fps} delay={4} />
          <Eye frame={frame} fps={fps} delay={8} />
        </div>
      </div>

      {/* Subtitle */}
      <div
        style={{
          opacity: subtitleOp * 0.6,
          fontFamily: MANROPE,
          fontWeight: 500,
          fontSize: 42,
          color: BRAND.ink,
          textAlign: "center",
          lineHeight: 1.3,
          letterSpacing: "-0.3px",
        }}
      >
        How well do you actually gift?
      </div>

      {/* Gold accent line */}
      <div
        style={{
          width: interpolate(frame, [12, 45], [0, 160], clamp),
          height: 4,
          backgroundColor: BRAND.gold,
          borderRadius: 2,
        }}
      />
    </AbsoluteFill>
  );
};
