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

// ─── Pure-CSS product icons ──────────────────────────────────────────────────

const MugIcon: React.FC = () => (
  <div style={{ position: "relative", width: 64, height: 68 }}>
    <div style={{ position: "absolute", bottom: 0, left: 0, width: 48, height: 50, border: `5px solid ${BRAND.terracotta}`, borderRadius: "0 0 14px 14px", borderTop: "none" }} />
    <div style={{ position: "absolute", top: 0, left: 0, width: 48, height: 6, backgroundColor: BRAND.terracotta, borderRadius: "3px 3px 0 0" }} />
    <div style={{ position: "absolute", top: 12, right: 0, width: 20, height: 24, border: `5px solid ${BRAND.terracotta}`, borderRadius: "0 12px 12px 0", borderLeft: "none" }} />
    {/* Steam lines */}
    <div style={{ position: "absolute", top: -10, left: 12, width: 4, height: 10, backgroundColor: BRAND.terracotta, borderRadius: 2, opacity: 0.5 }} />
    <div style={{ position: "absolute", top: -10, left: 24, width: 4, height: 10, backgroundColor: BRAND.terracotta, borderRadius: 2, opacity: 0.5 }} />
  </div>
);

const TeeIcon: React.FC = () => (
  <div style={{ position: "relative", width: 68, height: 64 }}>
    {/* Sleeves */}
    <div style={{ position: "absolute", top: 0, left: 0, width: 24, height: 20, backgroundColor: BRAND.terracotta, borderRadius: "12px 0 0 4px" }} />
    <div style={{ position: "absolute", top: 0, right: 0, width: 24, height: 20, backgroundColor: BRAND.terracotta, borderRadius: "0 12px 4px 0" }} />
    {/* Collar */}
    <div style={{ position: "absolute", top: 0, left: 22, right: 22, height: 16, backgroundColor: BRAND.terracotta, clipPath: "polygon(0 0, 100% 0, 75% 100%, 25% 100%)" }} />
    {/* Body */}
    <div style={{ position: "absolute", top: 16, left: 0, right: 0, bottom: 0, backgroundColor: BRAND.terracotta, borderRadius: "2px 2px 10px 10px" }} />
  </div>
);

const HoodieIcon: React.FC = () => (
  <div style={{ position: "relative", width: 68, height: 70 }}>
    {/* Sleeves */}
    <div style={{ position: "absolute", top: 0, left: 0, width: 22, height: 28, backgroundColor: BRAND.terracotta, borderRadius: "10px 0 0 6px" }} />
    <div style={{ position: "absolute", top: 0, right: 0, width: 22, height: 28, backgroundColor: BRAND.terracotta, borderRadius: "0 10px 6px 0" }} />
    {/* Hood */}
    <div style={{ position: "absolute", top: 0, left: 18, right: 18, height: 22, backgroundColor: BRAND.terracotta, borderRadius: "16px 16px 0 0" }} />
    {/* Body */}
    <div style={{ position: "absolute", top: 18, left: 0, right: 0, bottom: 0, backgroundColor: BRAND.terracotta, borderRadius: "0 0 10px 10px" }} />
    {/* Pocket */}
    <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", width: 30, height: 18, border: `3px solid rgba(255,254,249,0.5)`, borderRadius: "0 0 8px 8px", borderTop: "none" }} />
  </div>
);

const CanvasIcon: React.FC = () => (
  <div style={{ position: "relative", width: 64, height: 64 }}>
    <div style={{ position: "absolute", inset: 0, border: `6px solid ${BRAND.terracotta}`, borderRadius: 10 }} />
    <div style={{ position: "absolute", inset: 12, border: `3px solid ${BRAND.terracotta}`, borderRadius: 6, opacity: 0.5 }} />
    {/* Mount pegs */}
    <div style={{ position: "absolute", top: -4, left: "50%", transform: "translateX(-50%)", width: 14, height: 8, backgroundColor: BRAND.terracotta, borderRadius: 3 }} />
    <div style={{ position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)", width: 14, height: 8, backgroundColor: BRAND.terracotta, borderRadius: 3 }} />
  </div>
);

const CardIcon: React.FC = () => (
  <div style={{ position: "relative", width: 52, height: 66 }}>
    <div style={{ position: "absolute", inset: 0, border: `5px solid ${BRAND.terracotta}`, borderRadius: 8 }} />
    {/* Text lines */}
    <div style={{ position: "absolute", top: 18, left: 10, right: 10, height: 5, backgroundColor: BRAND.terracotta, borderRadius: 3, opacity: 0.7 }} />
    <div style={{ position: "absolute", top: 30, left: 10, right: 18, height: 5, backgroundColor: BRAND.terracotta, borderRadius: 3, opacity: 0.5 }} />
    <div style={{ position: "absolute", top: 42, left: 10, right: 14, height: 5, backgroundColor: BRAND.terracotta, borderRadius: 3, opacity: 0.35 }} />
  </div>
);

const PostcardIcon: React.FC = () => (
  <div style={{ position: "relative", width: 74, height: 52 }}>
    <div style={{ position: "absolute", inset: 0, border: `5px solid ${BRAND.terracotta}`, borderRadius: 8 }} />
    {/* Dividing line */}
    <div style={{ position: "absolute", top: 10, bottom: 10, left: "55%", width: 3, backgroundColor: BRAND.terracotta, borderRadius: 2, opacity: 0.5 }} />
    {/* Stamp */}
    <div style={{ position: "absolute", top: 10, right: 10, width: 18, height: 18, border: `3px solid ${BRAND.terracotta}`, borderRadius: 3, opacity: 0.7 }} />
    {/* Address lines */}
    <div style={{ position: "absolute", bottom: 18, left: 10, width: 30, height: 4, backgroundColor: BRAND.terracotta, borderRadius: 2, opacity: 0.4 }} />
    <div style={{ position: "absolute", bottom: 10, left: 10, width: 22, height: 4, backgroundColor: BRAND.terracotta, borderRadius: 2, opacity: 0.3 }} />
  </div>
);

const TILES = [
  { label: "Mugs",       Icon: MugIcon },
  { label: "T-Shirts",   Icon: TeeIcon },
  { label: "Hoodies",    Icon: HoodieIcon },
  { label: "Canvases",   Icon: CanvasIcon },
  { label: "Cards",      Icon: CardIcon },
  { label: "Postcards",  Icon: PostcardIcon },
];

// Stagger: tile i appears at frame i * 8 + 12
const TILE_START = (i: number) => i * 8 + 12;

export const ProductGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Header
  const headerSpring = spring({
    frame: Math.max(0, frame - 4),
    fps,
    config: { damping: 200, stiffness: 130, mass: 0.8 },
    from: 0,
    to: 1,
  });
  const headerOpacity = interpolate(headerSpring, [0, 1], [0, 1]);
  const headerY       = interpolate(headerSpring, [0, 1], [30, 0]);

  const accentWidth = interpolate(frame, [10, 38], [0, 180], clamp);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.cream,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 88px",
        gap: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 56,
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
        }}
      >
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 72,
            color: BRAND.ink,
            lineHeight: 1.05,
            letterSpacing: "-1.5px",
            marginBottom: 18,
          }}
        >
          Something for everyone
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

      {/* 2×3 grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          width: "100%",
        }}
      >
        {TILES.map(({ label, Icon }, i) => {
          const tileSpring = spring({
            frame: Math.max(0, frame - TILE_START(i)),
            fps,
            config: { damping: 180, stiffness: 260, mass: 0.5 },
            from: 0,
            to: 1,
          });
          const tileScale   = interpolate(tileSpring, [0, 1], [0.6, 1]);
          const tileOpacity = interpolate(tileSpring, [0, 0.6], [0, 1], clamp);

          return (
            <div
              key={label}
              style={{
                backgroundColor: BRAND.white,
                borderRadius: 24,
                padding: "32px 20px 28px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 20,
                boxShadow: "0 6px 24px rgba(45,41,38,0.10), 0 2px 8px rgba(45,41,38,0.06)",
                opacity: tileOpacity,
                transform: `scale(${tileScale})`,
                transformOrigin: "center center",
                height: 220,
              }}
            >
              <Icon />
              <div
                style={{
                  fontFamily: MANROPE,
                  fontWeight: 600,
                  fontSize: 30,
                  color: BRAND.ink,
                  letterSpacing: "-0.3px",
                  textAlign: "center",
                }}
              >
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
