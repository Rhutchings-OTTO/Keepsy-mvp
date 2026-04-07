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

export const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background fills from bottom
  const bgWipe = interpolate(frame, [0, 22], [100, 0], clamp);

  const makeSpring = (delay: number) =>
    spring({
      frame: Math.max(0, frame - delay),
      fps,
      config: { damping: 210, stiffness: 160, mass: 0.7 },
      from: 0,
      to: 1,
    });

  const s1 = makeSpring(18);  // "Find your"
  const s2 = makeSpring(28);  // "perfect gift"
  const s3 = makeSpring(46);  // "keepsy.store"
  const s4 = makeSpring(62);  // wordmark
  const s5 = makeSpring(58);  // accent line

  const toFade = (s: ReturnType<typeof makeSpring>) => ({
    opacity: interpolate(s, [0, 1], [0, 1]),
    transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
  });

  const toScale = (s: ReturnType<typeof makeSpring>) => ({
    opacity: interpolate(s, [0, 1], [0, 1]),
    transform: `scale(${interpolate(s, [0, 1], [0.82, 1])})`,
  });

  const accentWidth = interpolate(interpolate(s5, [0, 1], [0, 1]), [0, 1], [0, 180]);

  // Gold sparkles
  const sparkleOpacity = interpolate(frame, [55, 80], [0, 1], clamp);
  const sparkles = [
    { x: 75,  y: 480, size: 9,  phase: 0.0 },
    { x: 975, y: 430, size: 7,  phase: 1.4 },
    { x: 60,  y: 740, size: 8,  phase: 2.7 },
    { x: 960, y: 690, size: 6,  phase: 0.8 },
    { x: 505, y: 330, size: 7,  phase: 2.2 },
    { x: 180, y: 910, size: 5,  phase: 1.1 },
    { x: 850, y: 920, size: 6,  phase: 3.0 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.creamDark }}>
      {/* Forest green fill wipes up from bottom */}
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

      {/* Sparkles */}
      {sparkles.map((s, i) => {
        const pulse = Math.abs(Math.sin(frame * 0.10 + s.phase));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: s.size,
              height: s.size,
              borderRadius: "50%",
              backgroundColor: BRAND.gold,
              left: s.x,
              top: s.y,
              opacity: sparkleOpacity * (0.28 + 0.62 * pulse),
              transform: `scale(${0.5 + 0.6 * pulse})`,
              zIndex: 10,
            }}
          />
        );
      })}

      {/* Content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px",
          zIndex: 5,
          gap: 0,
        }}
      >
        {/* Headline line 1 */}
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 104,
            color: BRAND.white,
            lineHeight: 1.0,
            letterSpacing: "-2.5px",
            textAlign: "center",
            ...toScale(s1),
          }}
        >
          Find your
        </div>

        {/* Headline line 2 */}
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 104,
            color: BRAND.gold,
            lineHeight: 1.05,
            letterSpacing: "-2.5px",
            textAlign: "center",
            marginBottom: 48,
            ...toScale(s2),
          }}
        >
          perfect gift
        </div>

        {/* Terracotta accent line */}
        <div
          style={{
            width: accentWidth,
            height: 4,
            backgroundColor: BRAND.terracotta,
            borderRadius: 2,
            marginBottom: 44,
          }}
        />

        {/* URL */}
        <div
          style={{
            fontFamily: MANROPE,
            fontWeight: 600,
            fontSize: 52,
            color: BRAND.terracotta,
            letterSpacing: "0.5px",
            ...toFade(s3),
          }}
        >
          keepsy.store
        </div>
      </div>

      {/* Keepsy wordmark — bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          zIndex: 5,
          ...toFade(s4),
        }}
      >
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 52,
            color: BRAND.white,
            letterSpacing: "-1.5px",
            opacity: 0.5,
          }}
        >
          Keepsy
        </div>
      </div>
    </AbsoluteFill>
  );
};
