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

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fast punch-in spring
  const mainSpring = spring({
    frame,
    fps,
    config: { damping: 300, stiffness: 500, mass: 0.45 },
    from: 0,
    to: 1,
  });
  const scale   = interpolate(mainSpring, [0, 1], [0.68, 1]);
  const opacity = interpolate(mainSpring, [0, 0.5], [0, 1], clamp);

  // Price highlights with a slight delay
  const priceSpring = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { damping: 250, stiffness: 450, mass: 0.5 },
    from: 0,
    to: 1,
  });
  const priceScale = interpolate(priceSpring, [0, 1], [0.6, 1]);

  // Subtext fades in
  const subOpacity = interpolate(frame, [22, 45], [0, 1], clamp);

  // Gold accent line
  const accentWidth = interpolate(frame, [18, 50], [0, 220], clamp);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.forest,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 80px",
      }}
    >
      {/* Keepsy wordmark */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 64,
          fontFamily: FRAUNCES,
          fontWeight: 700,
          fontSize: 40,
          color: BRAND.white,
          letterSpacing: "-1px",
          opacity: opacity * 0.6,
        }}
      >
        Keepsy
      </div>

      {/* Main headline */}
      <div
        style={{
          textAlign: "center",
          opacity,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 102,
            color: BRAND.white,
            lineHeight: 1.05,
            letterSpacing: "-2.5px",
            marginBottom: 8,
          }}
        >
          Personalised gifts
        </div>
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 102,
            lineHeight: 1.05,
            letterSpacing: "-2.5px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.18em",
            flexWrap: "wrap" as const,
          }}
        >
          <span style={{ color: BRAND.white }}>from</span>
          <span
            style={{
              color: BRAND.gold,
              transform: `scale(${priceScale})`,
              display: "inline-block",
              transformOrigin: "center center",
            }}
          >
            £6.99
          </span>
        </div>
      </div>

      {/* Gold accent line */}
      <div
        style={{
          width: accentWidth,
          height: 4,
          backgroundColor: BRAND.gold,
          borderRadius: 2,
          marginTop: 40,
        }}
      />

      {/* Subtext */}
      <div
        style={{
          fontFamily: MANROPE,
          fontWeight: 500,
          fontSize: 36,
          color: BRAND.white,
          opacity: subOpacity * 0.6,
          marginTop: 28,
          textAlign: "center",
          letterSpacing: "-0.2px",
        }}
      >
        Mugs · Hoodies · Canvases · Cards & more
      </div>
    </AbsoluteFill>
  );
};
