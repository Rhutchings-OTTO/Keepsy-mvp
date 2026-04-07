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

// Warm-toned placeholder — replace src with a real photo when ready
const WarmPhotoPlaceholder: React.FC<{ zoom: number }> = ({ zoom }) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(145deg, #D4955A 0%, #BC6F38 45%, #8B4A1E 100%)",
    }}
  >
    {/* Subtle texture overlay */}
    <div
      style={{
        position: "absolute",
        inset: -20,
        transform: `scale(${zoom})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Camera icon (pure CSS) */}
      <div style={{ opacity: 0.28, display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        <div
          style={{
            width: 140,
            height: 105,
            border: "9px solid rgba(255,255,252,0.85)",
            borderRadius: 20,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Lens */}
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: "50%",
              border: "7px solid rgba(255,255,252,0.85)",
            }}
          />
          {/* Viewfinder bump */}
          <div
            style={{
              position: "absolute",
              top: -22,
              left: 18,
              width: 42,
              height: 18,
              backgroundColor: "rgba(255,255,252,0.85)",
              borderRadius: "5px 5px 0 0",
            }}
          />
        </div>
      </div>
    </div>
    {/* Warm radial vignette */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(ellipse at 40% 45%, transparent 28%, rgba(90,40,10,0.45) 100%)",
      }}
    />
  </div>
);

export const PhotoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phone frame slides in from bottom with a satisfying spring
  const slideSpring = spring({
    frame,
    fps,
    config: { damping: 160, stiffness: 90, mass: 1.1 },
    from: 0,
    to: 1,
  });
  const slideY = interpolate(slideSpring, [0, 1], [700, 0]);
  const frameOpacity = interpolate(slideSpring, [0, 0.4], [0, 1], clamp);

  // Slow zoom on the photo throughout the scene
  const zoom = interpolate(frame, [0, 120], [1.0, 1.06], clamp);

  // Caption fades in after phone settles
  const captionSpring = spring({
    frame: Math.max(0, frame - 28),
    fps,
    config: { damping: 200, stiffness: 120, mass: 0.8 },
    from: 0,
    to: 1,
  });
  const captionOpacity = interpolate(captionSpring, [0, 1], [0, 1]);
  const captionY = interpolate(captionSpring, [0, 1], [24, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.cream,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
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
          color: BRAND.ink,
          letterSpacing: "-1px",
          opacity: 0.45,
        }}
      >
        Keepsy
      </div>

      {/* Phone mockup */}
      <div
        style={{
          transform: `translateY(${slideY}px)`,
          opacity: frameOpacity,
        }}
      >
        <div
          style={{
            width: 460,
            height: 640,
            borderRadius: 48,
            border: `11px solid ${BRAND.ink}`,
            overflow: "hidden",
            position: "relative",
            boxShadow:
              "0 48px 96px rgba(45,41,38,0.30), 0 18px 36px rgba(45,41,38,0.16)",
          }}
        >
          {/* Notch */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: 120,
              height: 28,
              backgroundColor: BRAND.ink,
              borderRadius: "0 0 20px 20px",
              zIndex: 20,
            }}
          />
          <WarmPhotoPlaceholder zoom={zoom} />
        </div>
      </div>

      {/* Caption */}
      <div
        style={{
          marginTop: 60,
          opacity: captionOpacity,
          transform: `translateY(${captionY}px)`,
          textAlign: "center",
          padding: "0 80px",
        }}
      >
        <div
          style={{
            fontFamily: MANROPE,
            fontWeight: 500,
            fontSize: 46,
            color: BRAND.ink,
            letterSpacing: "-0.4px",
            opacity: 0.72,
            fontStyle: "italic",
          }}
        >
          Just an ordinary photo...
        </div>
      </div>
    </AbsoluteFill>
  );
};
