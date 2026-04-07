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

export const ScoreScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // "If you picked all the good ones..." — fades up
  const line1Spring = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 200, stiffness: 120, mass: 0.9 },
    from: 0,
    to: 1,
  });
  const line1Y  = interpolate(line1Spring, [0, 1], [30, 0]);
  const line1Op = interpolate(line1Spring, [0, 1], [0, 1]);

  // "You already know what to do." — big spring punch-in after beat
  const line2Spring = spring({
    frame: Math.max(0, frame - 66),
    fps,
    config: { damping: 240, stiffness: 180, mass: 0.7 },
    from: 0,
    to: 1,
  });
  const line2Scale = interpolate(line2Spring, [0, 1], [0.72, 1]);
  const line2Op    = interpolate(line2Spring, [0, 0.5], [0, 1], clamp);

  // Gold underline on "know" — grows after line2 enters
  const underlineW = interpolate(frame, [100, 130], [0, 148], clamp);

  // "know" highlight opacity
  const knowOp = interpolate(frame, [100, 118], [0, 1], clamp);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.forest,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 80px",
        gap: 40,
      }}
    >
      {/* Line 1 */}
      <div
        style={{
          opacity: line1Op * 0.8,
          transform: `translateY(${line1Y}px)`,
          fontFamily: MANROPE,
          fontWeight: 500,
          fontSize: 50,
          color: BRAND.white,
          textAlign: "center",
          lineHeight: 1.3,
          letterSpacing: "-0.4px",
        }}
      >
        If you picked all the good ones…
      </div>

      {/* Line 2 with "know" highlighted */}
      <div
        style={{
          opacity: line2Op,
          transform: `scale(${line2Scale})`,
          transformOrigin: "center center",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* Split the sentence to highlight "know" */}
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 84,
            color: BRAND.white,
            lineHeight: 1.05,
            letterSpacing: "-2px",
          }}
        >
          You already{" "}
          <span style={{ position: "relative", display: "inline-block" }}>
            <span
              style={{
                position: "relative",
                zIndex: 1,
                color: BRAND.gold,
                opacity: 0.5 + knowOp * 0.5,
              }}
            >
              know
            </span>
          </span>
        </div>
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 84,
            color: BRAND.white,
            lineHeight: 1.05,
            letterSpacing: "-2px",
          }}
        >
          what to do.
        </div>

        {/* Gold underline */}
        <div
          style={{
            width: underlineW,
            height: 5,
            backgroundColor: BRAND.gold,
            borderRadius: 2,
          }}
        />
      </div>

      {/* Tertiary nudge */}
      <div
        style={{
          opacity: interpolate(frame, [130, 155], [0, 0.6], clamp),
          fontFamily: MANROPE,
          fontWeight: 500,
          fontSize: 36,
          color: BRAND.white,
          textAlign: "center",
          lineHeight: 1.4,
          letterSpacing: "-0.2px",
        }}
      >
        (It's Keepsy, obviously.)
      </div>
    </AbsoluteFill>
  );
};
