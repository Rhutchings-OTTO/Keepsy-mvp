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

// A single five-pointed star rendered with CSS (border trick)
const Star: React.FC<{ filled: number; size: number }> = ({ filled, size }) => (
  <div
    style={{
      width: size,
      height: size,
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {/* Background (empty) star */}
    <div
      style={{
        fontSize: size,
        lineHeight: 1,
        color: `rgba(212,168,83,0.22)`,
        position: "absolute",
      }}
    >
      ★
    </div>
    {/* Filled star — clipped by opacity */}
    <div
      style={{
        fontSize: size,
        lineHeight: 1,
        color: BRAND.gold,
        position: "absolute",
        opacity: filled,
      }}
    >
      ★
    </div>
  </div>
);

const STAR_DELAYS = [0, 18, 36, 54, 72]; // frames at which each star begins to fill

// Small circular product thumbnail
const Thumbnail: React.FC<{
  src: string;
  opacity: number;
  x: number;
  y: number;
  size: number;
}> = ({ src, opacity, x, y, size }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: size,
      height: size,
      borderRadius: "50%",
      overflow: "hidden",
      border: `5px solid ${BRAND.cream}`,
      boxShadow: "0 8px 24px rgba(45,41,38,0.18)",
      opacity,
    }}
  >
    <Img
      src={staticFile(src)}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center",
      }}
    />
  </div>
);

const THUMBNAILS = [
  { src: "images/collection-wedding-canvas.png", x: 80,  y: 680, size: 140 },
  { src: "images/collection-pet-mug.png",         x: 830, y: 700, size: 120 },
  { src: "images/collection-hobby-tshirt.png",    x: 460, y: 820, size: 110 },
];

export const SocialProofScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Headline springs in
  const headlineSpring = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 200, stiffness: 120, mass: 0.8 },
    from: 0,
    to: 1,
  });
  const headlineOpacity = interpolate(headlineSpring, [0, 1], [0, 1]);
  const headlineY       = interpolate(headlineSpring, [0, 1], [40, 0]);

  // Rating text fades in
  const ratingOpacity = interpolate(frame, [55, 80], [0, 1], clamp);

  // Thumbnails fade in
  const thumbOpacity = interpolate(frame, [75, 105], [0, 1], clamp);

  // Gold background accent circle grows
  const circleScale = interpolate(
    spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 160, stiffness: 80, mass: 1.0 }, from: 0, to: 1 }),
    [0, 1],
    [0, 1]
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.creamDark,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Subtle decorative gold circle behind the star row */}
      <div
        style={{
          position: "absolute",
          width: 560,
          height: 560,
          borderRadius: "50%",
          backgroundColor: "rgba(212,168,83,0.07)",
          transform: `scale(${circleScale})`,
          top: "50%",
          left: "50%",
          marginTop: -280,
          marginLeft: -280,
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "0 80px",
          opacity: headlineOpacity,
          transform: `translateY(${headlineY}px)`,
        }}
      >
        {/* Stars */}
        <div style={{ display: "flex", gap: 12, marginBottom: 52 }}>
          {STAR_DELAYS.map((delay, i) => {
            const filled = interpolate(frame, [delay, delay + 14], [0, 1], clamp);
            return <Star key={i} filled={filled} size={88} />;
          })}
        </div>

        {/* Headline */}
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 600,
            fontSize: 72,
            color: BRAND.ink,
            textAlign: "center",
            lineHeight: 1.1,
            letterSpacing: "-1.5px",
            marginBottom: 24,
          }}
        >
          Hundreds of happy customers
        </div>

        {/* Rating line */}
        <div
          style={{
            fontFamily: MANROPE,
            fontWeight: 500,
            fontSize: 38,
            color: BRAND.ink,
            opacity: ratingOpacity * 0.65,
            letterSpacing: "-0.2px",
            textAlign: "center",
          }}
        >
          ★★★★½ &nbsp; Rated 4.5 / 5
        </div>

        {/* Gold accent line */}
        <div
          style={{
            width: interpolate(frame, [60, 100], [0, 120], clamp),
            height: 4,
            backgroundColor: BRAND.gold,
            borderRadius: 2,
            marginTop: 36,
          }}
        />
      </div>

      {/* Circular product thumbnails */}
      {THUMBNAILS.map((t, i) => (
        <Thumbnail key={i} {...t} opacity={thumbOpacity} />
      ))}
    </AbsoluteFill>
  );
};
