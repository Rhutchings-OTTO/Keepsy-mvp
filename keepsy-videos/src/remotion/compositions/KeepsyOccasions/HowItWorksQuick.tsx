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

// Each step appears 45 frames (1.5s) after the previous
const STEP_STARTS = [20, 65, 110] as const;

const STEPS = [
  "Upload a photo or describe your idea",
  "We craft your personalised design",
  "Delivered to your door",
];

interface StepRowProps {
  number: number;
  text: string;
  localFrame: number;
  fps: number;
  startFrame: number;
}

const StepRow: React.FC<StepRowProps> = ({ number, text, localFrame, fps, startFrame }) => {
  const enterSpring = spring({
    frame: Math.max(0, localFrame - startFrame),
    fps,
    config: { damping: 200, stiffness: 130, mass: 0.8 },
    from: 0,
    to: 1,
  });
  const opacity = interpolate(enterSpring, [0, 1], [0, 1]);
  const translateX = interpolate(enterSpring, [0, 1], [-48, 0]);

  // Number circle scale bounces in
  const circleSpring = spring({
    frame: Math.max(0, localFrame - startFrame),
    fps,
    config: { damping: 120, stiffness: 220, mass: 0.6 },
    from: 0,
    to: 1,
  });
  const circleScale = interpolate(circleSpring, [0, 1], [0, 1]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 36,
        opacity,
        transform: `translateX(${translateX}px)`,
      }}
    >
      {/* Numbered circle */}
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: "50%",
          backgroundColor: BRAND.terracotta,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transform: `scale(${circleScale})`,
        }}
      >
        <span
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 44,
            color: BRAND.white,
            lineHeight: 1,
          }}
        >
          {number}
        </span>
      </div>

      {/* Step text */}
      <div
        style={{
          fontFamily: MANROPE,
          fontWeight: 500,
          fontSize: 38,
          color: BRAND.ink,
          lineHeight: 1.35,
          letterSpacing: "-0.3px",
          flex: 1,
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const HowItWorksQuick: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Header spring
  const headerSpring = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { damping: 200, stiffness: 130, mass: 0.8 },
    from: 0,
    to: 1,
  });
  const headerOpacity = interpolate(headerSpring, [0, 1], [0, 1]);
  const headerY       = interpolate(headerSpring, [0, 1], [30, 0]);

  // Gold accent line
  const accentWidth = interpolate(frame, [12, 45], [0, 160], clamp);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.cream,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 72px",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 72,
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
        }}
      >
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 84,
            color: BRAND.ink,
            lineHeight: 1.05,
            letterSpacing: "-2px",
            marginBottom: 20,
          }}
        >
          Three simple steps
        </div>
        <div
          style={{
            width: accentWidth,
            height: 4,
            backgroundColor: BRAND.gold,
            borderRadius: 2,
            margin: "0 auto",
          }}
        />
      </div>

      {/* Steps */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 48,
          width: "100%",
        }}
      >
        {STEPS.map((text, i) => (
          <StepRow
            key={i}
            number={i + 1}
            text={text}
            localFrame={frame}
            fps={fps}
            startFrame={STEP_STARTS[i]}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
