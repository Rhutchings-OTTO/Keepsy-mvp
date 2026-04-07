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

// Each prop fades in 45 frames (1.5s) after the previous
const PROP_STARTS = [20, 65, 110] as const;

// ─── Simple CSS icons inside a terracotta circle ──────────────────────────────

// Paintbrush (Crafted with care)
const BrushIcon: React.FC = () => (
  <div style={{ position: "relative", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
    {/* Handle */}
    <div style={{ width: 7, height: 26, backgroundColor: BRAND.white, borderRadius: 3, transform: "rotate(-30deg)", position: "absolute" }} />
    {/* Bristle head */}
    <div style={{ width: 10, height: 12, backgroundColor: BRAND.white, borderRadius: "3px 3px 6px 6px", transform: "rotate(-30deg)", position: "absolute", top: 4, left: 8, opacity: 0.9 }} />
  </div>
);

// Box/Package (Fast delivery)
const BoxIcon: React.FC = () => (
  <div style={{ position: "relative", width: 40, height: 38, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
    {/* Box body */}
    <div style={{ width: 32, height: 26, border: "3px solid rgba(255,254,249,0.9)", borderRadius: 4, position: "absolute", bottom: 0 }} />
    {/* Lid */}
    <div style={{ position: "absolute", top: 0, left: 3, right: 3, height: 14, border: "3px solid rgba(255,254,249,0.9)", borderRadius: "4px 4px 0 0", borderBottom: "none" }} />
    {/* Ribbon */}
    <div style={{ position: "absolute", bottom: 0, left: "50%", width: 3, height: 26, backgroundColor: "rgba(255,254,249,0.6)", transform: "translateX(-50%)" }} />
  </div>
);

// Eye/Preview (Preview before you buy)
const EyeIcon: React.FC = () => (
  <div style={{ position: "relative", width: 42, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
    {/* Eye outline — two arcs meeting */}
    <div style={{ width: 38, height: 22, border: "3px solid rgba(255,254,249,0.9)", borderRadius: "50%", position: "absolute" }} />
    {/* Pupil */}
    <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: "rgba(255,254,249,0.9)", position: "absolute" }} />
    {/* Inner pupil */}
    <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: BRAND.terracotta, position: "absolute" }} />
  </div>
);

const PROPS = [
  {
    Icon: BrushIcon,
    headline: "Crafted with care",
    sub: "Every design is reviewed by our team before printing",
  },
  {
    Icon: BoxIcon,
    headline: "Fast UK & US delivery",
    sub: "Delivered to your door in as little as 3–5 days",
  },
  {
    Icon: EyeIcon,
    headline: "Preview before you buy",
    sub: "See exactly how your gift will look before you order",
  },
];

interface PropRowProps {
  icon: React.FC;
  headline: string;
  sub: string;
  localFrame: number;
  fps: number;
  startFrame: number;
}

const PropRow: React.FC<PropRowProps> = ({ icon: Icon, headline, sub, localFrame, fps, startFrame }) => {
  const enterSpring = spring({
    frame: Math.max(0, localFrame - startFrame),
    fps,
    config: { damping: 200, stiffness: 130, mass: 0.8 },
    from: 0,
    to: 1,
  });
  const opacity    = interpolate(enterSpring, [0, 1], [0, 1]);
  const translateX = interpolate(enterSpring, [0, 1], [-50, 0]);

  // Circle bounces in
  const circleSpring = spring({
    frame: Math.max(0, localFrame - startFrame),
    fps,
    config: { damping: 130, stiffness: 240, mass: 0.55 },
    from: 0,
    to: 1,
  });
  const circleScale = interpolate(circleSpring, [0, 1], [0, 1]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 32,
        opacity,
        transform: `translateX(${translateX}px)`,
      }}
    >
      {/* Terracotta circle icon */}
      <div
        style={{
          width: 92,
          height: 92,
          borderRadius: "50%",
          backgroundColor: BRAND.terracotta,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${circleScale})`,
        }}
      >
        <Icon />
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: MANROPE,
            fontWeight: 600,
            fontSize: 42,
            color: BRAND.ink,
            lineHeight: 1.15,
            letterSpacing: "-0.5px",
            marginBottom: 8,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            fontFamily: MANROPE,
            fontWeight: 500,
            fontSize: 30,
            color: BRAND.ink,
            opacity: 0.6,
            lineHeight: 1.4,
            letterSpacing: "-0.2px",
          }}
        >
          {sub}
        </div>
      </div>
    </div>
  );
};

export const ValuePropsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerSpring = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { damping: 200, stiffness: 130, mass: 0.8 },
    from: 0,
    to: 1,
  });
  const headerOpacity = interpolate(headerSpring, [0, 1], [0, 1]);
  const headerY       = interpolate(headerSpring, [0, 1], [28, 0]);
  const accentWidth   = interpolate(frame, [10, 40], [0, 160], clamp);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.creamDark,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 72px",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 68,
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
        }}
      >
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 78,
            color: BRAND.ink,
            lineHeight: 1.05,
            letterSpacing: "-1.5px",
            marginBottom: 18,
          }}
        >
          Why Keepsy?
        </div>
        <div
          style={{
            width: accentWidth,
            height: 4,
            backgroundColor: BRAND.gold,
            borderRadius: 2,
            margin: "0 auto",
          }}
        />
      </div>

      {/* Props list */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 48,
          width: "100%",
        }}
      >
        {PROPS.map((p, i) => (
          <PropRow
            key={i}
            icon={p.Icon}
            headline={p.headline}
            sub={p.sub}
            localFrame={frame}
            fps={fps}
            startFrame={PROP_STARTS[i]}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
