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

// Word-by-word stagger timings (frames)
const WORDS = ["Still", "searching", "for", "the", "perfect", "gift?"];
const WORD_STARTS = [4, 11, 18, 23, 29, 37];

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Keepsy wordmark fades in
  const wordmarkOpacity = interpolate(frame, [0, 10], [0, 1], clamp);

  // "gift?" bounces in with an underdamped spring
  const bounceSpring = spring({
    frame: Math.max(0, frame - WORD_STARTS[5]),
    fps,
    config: { damping: 70, stiffness: 280, mass: 0.55 },
    from: 0,
    to: 1,
  });
  const bounceScale = interpolate(bounceSpring, [0, 1], [1.6, 1]);

  // Gold accent line grows after all words have appeared
  const accentWidth = interpolate(frame, [50, 80], [0, 260], clamp);

  // Subtitle fades in
  const subtitleOpacity = interpolate(frame, [58, 82], [0, 1], clamp);

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
      {/* Keepsy wordmark — top-left */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 64,
          opacity: wordmarkOpacity,
          fontFamily: FRAUNCES,
          fontWeight: 700,
          fontSize: 40,
          color: BRAND.ink,
          letterSpacing: "-1px",
        }}
      >
        Keepsy
      </div>

      {/* Hook sentence */}
      <div
        style={{
          padding: "0 72px",
          textAlign: "center",
          fontFamily: FRAUNCES,
          fontWeight: 700,
          fontSize: 90,
          color: BRAND.ink,
          lineHeight: 1.08,
          letterSpacing: "-2.5px",
        }}
      >
        {WORDS.map((word, i) => {
          const start = WORD_STARTS[i];
          const isLast = i === WORDS.length - 1;

          // Last word uses the bounce spring; others use a fast fade+rise
          const wordSpring = isLast
            ? bounceSpring
            : spring({
                frame: Math.max(0, frame - start),
                fps,
                config: { damping: 350, stiffness: 500, mass: 0.4 },
                from: 0,
                to: 1,
              });

          const wordOpacity = interpolate(wordSpring, [0, 0.6], [0, 1], clamp);
          const wordY = interpolate(wordSpring, [0, 1], [28, 0]);
          const wordScale = isLast ? bounceScale : 1;

          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: wordOpacity,
                transform: `translateY(${wordY}px) scale(${wordScale})`,
                transformOrigin: "center bottom",
                marginRight: i === WORDS.length - 1 ? 0 : "0.22em",
                color: isLast ? BRAND.terracotta : BRAND.ink,
              }}
            >
              {word}
            </span>
          );
        })}
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

      {/* Subtitle */}
      <div
        style={{
          fontFamily: MANROPE,
          fontWeight: 500,
          fontSize: 36,
          color: BRAND.ink,
          opacity: subtitleOpacity * 0.55,
          marginTop: 28,
          letterSpacing: "-0.2px",
          textAlign: "center",
          padding: "0 80px",
        }}
      >
        We make it easy
      </div>
    </AbsoluteFill>
  );
};
