import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
} from "remotion";
import { BRAND } from "../KeepsyReel/fonts";
import { CTAScene } from "./CTAScene";
import { HookScene } from "./HookScene";
import { HowItWorksQuick } from "./HowItWorksQuick";
import { OccasionCarousel } from "./OccasionCarousel";

// ─── Scene timings (frames at 30fps) ────────────────────────────────────────
//  Scene 1 — Hook             :   0 –  89  ( 90 frames =  3.0 s)
//  Scene 2 — Occasions        :  90 – 599  (510 frames = 17.0 s, 5 × 102fr)
//  Scene 3 — How It Works     : 600 – 809  (210 frames =  7.0 s)
//  Scene 4 — CTA              : 810 – 1049 (240 frames =  8.0 s)
//  Total: 1050 frames = 35 s

export const SCENES = {
  hook:       { from: 0,   duration: 90  },
  occasions:  { from: 90,  duration: 510 },
  howItWorks: { from: 600, duration: 210 },
  cta:        { from: 810, duration: 240 },
} as const;

// Terracotta flash transitions between top-level scenes.
// The OccasionCarousel handles its own wipe transitions internally.
const FLASH_RANGES: [number, number][] = [
  [87,  92],  // Hook → Occasions
  [597, 602], // Occasions → How It Works
  [807, 812], // How It Works → CTA
];

export const KeepsyOccasions: React.FC = () => {
  const frame = useCurrentFrame();
  const isFlashing = FLASH_RANGES.some(([a, b]) => frame >= a && frame <= b);

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.cream }}>
      {/* ── Scene 1: Hook ── */}
      <Sequence from={SCENES.hook.from} durationInFrames={SCENES.hook.duration}>
        <HookScene />
      </Sequence>

      {/* ── Scene 2: Occasion Carousel ── */}
      <Sequence from={SCENES.occasions.from} durationInFrames={SCENES.occasions.duration}>
        <OccasionCarousel />
      </Sequence>

      {/* ── Scene 3: How It Works (Quick) ── */}
      <Sequence from={SCENES.howItWorks.from} durationInFrames={SCENES.howItWorks.duration}>
        <HowItWorksQuick />
      </Sequence>

      {/* ── Scene 4: CTA ── */}
      <Sequence from={SCENES.cta.from} durationInFrames={SCENES.cta.duration}>
        <CTAScene />
      </Sequence>

      {/* ── Scene transition flashes (terracotta) ── */}
      {isFlashing && (
        <AbsoluteFill
          style={{
            backgroundColor: BRAND.terracotta,
            opacity: 0.88,
            zIndex: 100,
          }}
        />
      )}
    </AbsoluteFill>
  );
};
