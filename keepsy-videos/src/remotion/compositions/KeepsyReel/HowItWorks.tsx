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

const STEP_FRAMES = 90; // each step = 90 frames = 3.0s

// ─── Step icons (pure CSS shapes) ──────────────────────────────────────────

const UploadIcon: React.FC<{ progress: number }> = ({ progress }) => {
  const boxY = interpolate(progress, [0, 1], [20, 0]);
  return (
    <div style={{ position: "relative", width: 160, height: 160 }}>
      {/* Photo frame */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: `6px solid ${BRAND.terracotta}`,
          borderRadius: 24,
          opacity: interpolate(progress, [0, 0.4], [0, 1], clamp),
        }}
      />
      {/* Photo placeholder fills */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          right: 20,
          bottom: 50,
          backgroundColor: BRAND.creamDark,
          borderRadius: 14,
          opacity: interpolate(progress, [0.2, 0.7], [0, 1], clamp),
        }}
      />
      {/* Upward arrow */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: "50%",
          transform: `translateX(-50%) translateY(${boxY}px)`,
          opacity: interpolate(progress, [0.4, 0.9], [0, 1], clamp),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
        }}
      >
        {/* Arrow head */}
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderBottom: `16px solid ${BRAND.terracotta}`,
          }}
        />
        {/* Arrow shaft */}
        <div
          style={{
            width: 6,
            height: 18,
            backgroundColor: BRAND.terracotta,
          }}
        />
      </div>
    </div>
  );
};

const TransformIcon: React.FC<{ progress: number }> = ({ progress }) => {
  const rotate = interpolate(progress, [0, 1], [0, 360]);
  const innerScale = interpolate(progress, [0, 0.5, 1], [0.3, 1.15, 1]);
  return (
    <div style={{ position: "relative", width: 160, height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Outer ring */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: `4px solid ${BRAND.gold}`,
          borderRadius: "50%",
          opacity: interpolate(progress, [0, 0.3], [0, 0.6], clamp),
          transform: `rotate(${rotate * 0.3}deg)`,
          borderStyle: "dashed",
        }}
      />
      {/* Sparkle arms */}
      {[0, 45, 90, 135].map((angle) => (
        <div
          key={angle}
          style={{
            position: "absolute",
            width: 4,
            height: interpolate(progress, [0, 0.6, 1], [0, 60, 50]),
            backgroundColor: BRAND.gold,
            borderRadius: 2,
            transform: `rotate(${angle + rotate * 0.15}deg)`,
            transformOrigin: "50% 80px",
            opacity: interpolate(progress, [0.1, 0.5], [0, 1], clamp),
          }}
        />
      ))}
      {/* Centre star */}
      <div
        style={{
          width: 40,
          height: 40,
          backgroundColor: BRAND.terracotta,
          borderRadius: "50%",
          transform: `scale(${innerScale})`,
          opacity: interpolate(progress, [0, 0.3], [0, 1], clamp),
        }}
      />
    </div>
  );
};

const PrintIcon: React.FC<{ progress: number }> = ({ progress }) => {
  const hoodieHeight = interpolate(progress, [0, 0.7], [0, 120], clamp);
  return (
    <div
      style={{
        position: "relative",
        width: 160,
        height: 160,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Hoodie silhouette (simplified box + shoulders) */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 100,
          height: hoodieHeight,
          backgroundColor: BRAND.ink,
          borderRadius: "12px 12px 8px 8px",
          opacity: interpolate(progress, [0, 0.1], [0, 1], clamp),
        }}
      />
      {/* Shoulder left */}
      <div
        style={{
          position: "absolute",
          bottom: hoodieHeight * 0.7,
          left: "50%",
          marginLeft: -80,
          width: 40,
          height: hoodieHeight * 0.35,
          backgroundColor: BRAND.ink,
          borderRadius: "14px 0 0 0",
          opacity: interpolate(progress, [0.1, 0.4], [0, 1], clamp),
        }}
      />
      {/* Shoulder right */}
      <div
        style={{
          position: "absolute",
          bottom: hoodieHeight * 0.7,
          left: "50%",
          marginLeft: 40,
          width: 40,
          height: hoodieHeight * 0.35,
          backgroundColor: BRAND.ink,
          borderRadius: "0 14px 0 0",
          opacity: interpolate(progress, [0.1, 0.4], [0, 1], clamp),
        }}
      />
      {/* Terracotta print on chest */}
      <div
        style={{
          position: "absolute",
          bottom: hoodieHeight * 0.35,
          left: "50%",
          width: 40,
          height: 40,
          borderRadius: "50%",
          backgroundColor: BRAND.terracotta,
          opacity: interpolate(progress, [0.5, 0.9], [0, 1], clamp),
          transform: `translateX(-50%) scale(${interpolate(progress, [0.5, 0.9], [0, 1], clamp)})`,
        }}
      />
    </div>
  );
};

// ─── Individual step slide ──────────────────────────────────────────────────

interface StepProps {
  stepIndex: number;
  localFrame: number;
  fps: number;
}

const STEP_CONFIGS = [
  {
    title: "Upload your photo",
    subtitle: "Drop in a cherished memory — a pet, a moment, a face you love",
    bg: BRAND.cream,
    Icon: UploadIcon,
  },
  {
    title: "We transform it into art",
    subtitle: "Our craftspeople turn your photo into a beautiful, unique design",
    bg: BRAND.creamDark,
    Icon: TransformIcon,
  },
  {
    title: "Printed on premium products",
    subtitle: "Hoodies · Mugs · Tees · Canvas · Cards",
    bg: BRAND.cream,
    Icon: PrintIcon,
  },
];

const Step: React.FC<StepProps> = ({ stepIndex, localFrame, fps }) => {
  const config = STEP_CONFIGS[stepIndex];

  // Wipe-in transition: a terracotta bar sweeps from left (first ~14 frames of each step)
  const wipeInProgress = interpolate(localFrame, [0, 7], [0, 1], clamp);
  const wipeOutProgress = interpolate(localFrame, [7, 14], [0, 1], clamp);
  const showWipe = localFrame < 14 && stepIndex > 0;

  // Content enters after wipe
  const contentDelay = stepIndex > 0 ? 10 : 0;
  const contentSpring = spring({
    frame: Math.max(0, localFrame - contentDelay),
    fps,
    config: { damping: 200, stiffness: 120, mass: 0.8 },
    from: 0,
    to: 1,
  });
  const contentOpacity = interpolate(contentSpring, [0, 1], [0, 1]);
  const contentY = interpolate(contentSpring, [0, 1], [40, 0]);

  // Icon progress (0→1 over 55 frames after content appears)
  const iconProgress = interpolate(
    localFrame,
    [contentDelay + 2, contentDelay + 55],
    [0, 1],
    clamp
  );

  // Step number and indicator
  const dotOpacity = interpolate(localFrame, [contentDelay, contentDelay + 15], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: config.bg }}>
      {/* Wipe transition overlay */}
      {showWipe && (
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: wipeOutProgress < 1 ? 0 : `${wipeOutProgress * 100}%`,
            width:
              wipeOutProgress > 0
                ? `${(1 - wipeOutProgress) * 100}%`
                : `${wipeInProgress * 100}%`,
            backgroundColor: BRAND.terracotta,
            zIndex: 50,
          }}
        />
      )}

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
          opacity: contentOpacity,
          transform: `translateY(${contentY}px)`,
        }}
      >
        {/* Step indicator dots */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 60,
            opacity: dotOpacity,
          }}
        >
          {STEP_CONFIGS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === stepIndex ? 32 : 10,
                height: 10,
                borderRadius: 5,
                backgroundColor:
                  i === stepIndex ? BRAND.terracotta : BRAND.ink,
                opacity: i === stepIndex ? 1 : 0.2,
                transition: "width 0.3s",
              }}
            />
          ))}
        </div>

        {/* Icon area */}
        <div style={{ marginBottom: 56 }}>
          <config.Icon progress={iconProgress} />
        </div>

        {/* Step number */}
        <div
          style={{
            fontFamily: MANROPE,
            fontWeight: 700,
            fontSize: 26,
            color: BRAND.terracotta,
            letterSpacing: "3px",
            textTransform: "uppercase",
            marginBottom: 20,
            opacity: dotOpacity,
          }}
        >
          Step {stepIndex + 1}
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 72,
            color: BRAND.ink,
            textAlign: "center",
            lineHeight: 1.1,
            letterSpacing: "-1.5px",
            marginBottom: 28,
          }}
        >
          {config.title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontFamily: MANROPE,
            fontWeight: 500,
            fontSize: 38,
            color: BRAND.ink,
            opacity: 0.65,
            textAlign: "center",
            lineHeight: 1.5,
            letterSpacing: "-0.3px",
          }}
        >
          {config.subtitle}
        </div>

        {/* Terracotta accent bar */}
        <div
          style={{
            width: interpolate(localFrame, [contentDelay + 5, contentDelay + 45], [0, 80], clamp),
            height: 4,
            backgroundColor: BRAND.terracotta,
            borderRadius: 2,
            marginTop: 40,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// ─── Main component ─────────────────────────────────────────────────────────

export const HowItWorks: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stepIndex = Math.min(2, Math.floor(frame / STEP_FRAMES));
  const localFrame = frame % STEP_FRAMES;

  return (
    <AbsoluteFill>
      <Step stepIndex={stepIndex} localFrame={localFrame} fps={fps} />
    </AbsoluteFill>
  );
};
