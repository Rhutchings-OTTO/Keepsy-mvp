import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND, FRAUNCES } from "../KeepsyReel/fonts";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

interface SparkleProps {
  x: number;
  y: number;
  size: number;
  phase: number;
  frame: number;
  baseOpacity: number;
}

const Sparkle: React.FC<SparkleProps> = ({ x, y, size, phase, frame, baseOpacity }) => {
  const pulse = Math.abs(Math.sin(frame * 0.11 + phase));
  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: BRAND.gold,
        left: x,
        top: y,
        opacity: baseOpacity * (0.25 + 0.65 * pulse),
        transform: `scale(${0.5 + 0.6 * pulse})`,
      }}
    />
  );
};

const SPARKLES = [
  { x: 80,  y: 320, size: 11, phase: 0.0 },
  { x: 940, y: 280, size: 8,  phase: 1.3 },
  { x: 980, y: 540, size: 10, phase: 2.6 },
  { x: 60,  y: 620, size: 7,  phase: 0.9 },
  { x: 900, y: 720, size: 9,  phase: 1.8 },
  { x: 500, y: 140, size: 6,  phase: 3.2 },
  { x: 150, y: 880, size: 8,  phase: 2.1 },
  { x: 870, y: 950, size: 6,  phase: 0.4 },
  { x: 280, y: 200, size: 5,  phase: 1.6 },
  { x: 760, y: 160, size: 7,  phase: 2.9 },
];

export const TransformScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Terracotta wipe in/out (0–20 frames) ──
  const wipeInProgress  = interpolate(frame, [0,  10], [0, 1], clamp);
  const wipeOutProgress = interpolate(frame, [10, 20], [0, 1], clamp);
  const showWipe = frame < 22;

  // ── Curtain reveal of artwork (left-to-right, 20–70 frames) ──
  const revealProgress = interpolate(frame, [20, 70], [0, 1], clamp);

  // ── Text bar slides up (65–100 frames) ──
  const textSpring = spring({
    frame: Math.max(0, frame - 65),
    fps,
    config: { damping: 200, stiffness: 130, mass: 0.8 },
    from: 0,
    to: 1,
  });
  const textY       = interpolate(textSpring, [0, 1], [90, 0]);
  const textOpacity = interpolate(textSpring, [0, 1], [0, 1]);

  // ── Gold sparkles fade in after text (80–105 frames) ──
  const sparkleOpacity = interpolate(frame, [80, 108], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.ink }}>
      {/* Full-bleed artwork */}
      <div style={{ position: "absolute", inset: 0 }}>
        <Img
          src={staticFile("images/collection-wedding-canvas.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            display: "block",
          }}
        />
        {/* Dual vignette — dark top + forest bottom */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(45,41,38,0.55) 0%, transparent 28%, transparent 55%, rgba(43,64,56,0.75) 100%)",
          }}
        />
      </div>

      {/* Curtain reveal mask (ink panel slides off to the right) */}
      {revealProgress < 1 && (
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${revealProgress * 100}%`,
            right: 0,
            backgroundColor: BRAND.ink,
            zIndex: 10,
          }}
        />
      )}

      {/* Gold sparkles */}
      {SPARKLES.map((s, i) => (
        <Sparkle key={i} {...s} frame={frame} baseOpacity={sparkleOpacity} />
      ))}

      {/* Text bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
          zIndex: 20,
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(43,64,56,0.90)",
            padding: "40px 64px 80px",
          }}
        >
          <div
            style={{
              fontFamily: FRAUNCES,
              fontWeight: 700,
              fontSize: 64,
              color: BRAND.white,
              lineHeight: 1.1,
              letterSpacing: "-1.5px",
            }}
          >
            ...becomes a work of art
          </div>
          {/* Gold accent */}
          <div
            style={{
              width: interpolate(frame, [75, 120], [0, 100], clamp),
              height: 4,
              backgroundColor: BRAND.gold,
              borderRadius: 2,
              marginTop: 20,
            }}
          />
        </div>
      </div>

      {/* Terracotta wipe overlay */}
      {showWipe && (
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: wipeOutProgress > 0 ? `${wipeOutProgress * 100}%` : 0,
            width:
              wipeOutProgress > 0
                ? `${(1 - wipeOutProgress) * 100}%`
                : `${wipeInProgress * 100}%`,
            backgroundColor: BRAND.terracotta,
            zIndex: 50,
          }}
        />
      )}
    </AbsoluteFill>
  );
};
