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

export const FixScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Forest green wipes up from bottom (0–22fr)
  const bgWipe = interpolate(frame, [0, 22], [100, 0], clamp);

  // "Or..." — fades in at frame 20
  const orOp = interpolate(frame, [20, 36], [0, 1], clamp);

  // Main line springs in after beat (frame 46)
  const mainSpring = spring({
    frame: Math.max(0, frame - 46),
    fps,
    config: { damping: 220, stiffness: 160, mass: 0.7 },
    from: 0,
    to: 1,
  });
  const mainScale = interpolate(mainSpring, [0, 1], [0.78, 1]);
  const mainOp    = interpolate(mainSpring, [0, 0.5], [0, 1], clamp);

  // "treasure" shimmer — starts when mainSpring settles
  const shimmerPhase = Math.max(0, frame - 62);
  const shimmer = Math.abs(Math.sin(shimmerPhase * 0.16)) * 0.35 + 0.65;

  // Terracotta underline grows beneath full sentence
  const underlineW = interpolate(frame, [68, 100], [0, 780], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.creamDark }}>
      {/* Forest green wipes up */}
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

      {/* Content */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px",
          gap: 36,
          zIndex: 5,
        }}
      >
        {/* "Or..." */}
        <div
          style={{
            opacity: orOp * 0.8,
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontStyle: "italic",
            fontSize: 68,
            color: BRAND.white,
            textAlign: "center",
            letterSpacing: "-1.5px",
          }}
        >
          Or...
        </div>

        {/* Main sentence with "treasure" in gold */}
        <div
          style={{
            opacity: mainOp,
            transform: `scale(${mainScale})`,
            transformOrigin: "center center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: FRAUNCES,
              fontWeight: 700,
              fontSize: 72,
              color: BRAND.white,
              lineHeight: 1.1,
              letterSpacing: "-1.8px",
              textAlign: "center",
            }}
          >
            You could give them{"\n"}something they'll actually{" "}
            <span style={{ color: BRAND.gold, opacity: shimmer }}>
              treasure
            </span>
          </div>

          {/* Terracotta underline */}
          <div
            style={{
              width: underlineW,
              height: 5,
              backgroundColor: BRAND.terracotta,
              borderRadius: 2,
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
