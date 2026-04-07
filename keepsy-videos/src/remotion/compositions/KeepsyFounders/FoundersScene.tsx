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
import { BRAND, FRAUNCES, MANROPE } from "../KeepsyReel/fonts";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const FoundersScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Image — gentle spring, not punchy
  const imgSpring = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 200, stiffness: 100, mass: 1.0 },
    from: 0,
    to: 1,
  });
  const imgScale = interpolate(imgSpring, [0, 1], [0.82, 1]);
  const imgOp    = interpolate(imgSpring, [0, 0.6], [0, 1], clamp);

  // "Meet Rory & Dan" — springs in after image settles
  const nameSpring = spring({
    frame: Math.max(0, frame - 40),
    fps,
    config: { damping: 200, stiffness: 110, mass: 0.9 },
    from: 0,
    to: 1,
  });
  const nameY  = interpolate(nameSpring, [0, 1], [28, 0]);
  const nameOp = interpolate(nameSpring, [0, 1], [0, 1]);

  // "Co-Founders of Keepsy" — fades in gently
  const subOp = interpolate(frame, [78, 112], [0, 1], clamp);

  // Gold accent line
  const lineW = interpolate(frame, [86, 125], [0, 180], clamp);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.cream,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 80px",
        gap: 32,
      }}
    >
      {/* Founders cartoon */}
      <div
        style={{
          opacity: imgOp,
          transform: `scale(${imgScale})`,
          transformOrigin: "center center",
          width: "62%",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 16px 48px rgba(45,41,38,0.12)",
        }}
      >
        <Img
          src={staticFile("images/founders-cartoon.png")}
          style={{
            width: "100%",
            display: "block",
          }}
        />
      </div>

      {/* "Meet Rory & Dan" */}
      <div
        style={{
          opacity: nameOp,
          transform: `translateY(${nameY}px)`,
          fontFamily: FRAUNCES,
          fontWeight: 700,
          fontSize: 76,
          color: BRAND.ink,
          lineHeight: 1.05,
          letterSpacing: "-1.8px",
          textAlign: "center",
        }}
      >
        Meet Rory & Dan
      </div>

      {/* Gold line */}
      <div
        style={{
          width: lineW,
          height: 4,
          backgroundColor: BRAND.gold,
          borderRadius: 2,
        }}
      />

      {/* "Co-Founders of Keepsy" */}
      <div
        style={{
          opacity: subOp,
          fontFamily: MANROPE,
          fontWeight: 500,
          fontSize: 40,
          color: BRAND.terracotta,
          textAlign: "center",
          letterSpacing: "-0.3px",
        }}
      >
        Co-Founders of Keepsy
      </div>
    </AbsoluteFill>
  );
};
