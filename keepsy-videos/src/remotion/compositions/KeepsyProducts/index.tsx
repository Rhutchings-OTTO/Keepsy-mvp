import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
} from "remotion";
import { BRAND } from "../KeepsyReel/fonts";
import { CTAScene } from "./CTAScene";
import { HookScene } from "./HookScene";
import { ProductDeepDives } from "./ProductDeepDives";
import { ProductGrid } from "./ProductGrid";
import { ValuePropsScene } from "./ValuePropsScene";

// ─── Scene timings (frames at 30fps) ────────────────────────────────────────
//  Scene 1 — Hook            :   0 –  59  ( 60 frames =  2.0 s)
//  Scene 2 — Product Grid    :  60 – 179  (120 frames =  4.0 s)
//  Scene 3 — Product Dives   : 180 – 779  (600 frames = 20.0 s, 5 × 120fr)
//  Scene 4 — Value Props     : 780 – 929  (150 frames =  5.0 s)
//  Scene 5 — CTA             : 930 – 1049 (120 frames =  4.0 s)
//  Total: 1050 frames = 35 s

export const SCENES = {
  hook:        { from: 0,   duration: 60  },
  grid:        { from: 60,  duration: 120 },
  deepDives:   { from: 180, duration: 600 },
  valueProps:  { from: 780, duration: 150 },
  cta:         { from: 930, duration: 120 },
} as const;

// Terracotta flash transitions between top-level scenes.
// ProductDeepDives handles its own internal wipe transitions.
const FLASH_RANGES: [number, number][] = [
  [57,  62],  // Hook → Grid
  [177, 182], // Grid → Deep Dives
  [777, 782], // Deep Dives → Value Props
  [927, 932], // Value Props → CTA
];

export const KeepsyProducts: React.FC = () => {
  const frame = useCurrentFrame();
  const isFlashing = FLASH_RANGES.some(([a, b]) => frame >= a && frame <= b);

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.cream }}>
      {/* ── Scene 1: Hook ── */}
      <Sequence from={SCENES.hook.from} durationInFrames={SCENES.hook.duration}>
        <HookScene />
      </Sequence>

      {/* ── Scene 2: Product Grid ── */}
      <Sequence from={SCENES.grid.from} durationInFrames={SCENES.grid.duration}>
        <ProductGrid />
      </Sequence>

      {/* ── Scene 3: Product Deep Dives ── */}
      <Sequence from={SCENES.deepDives.from} durationInFrames={SCENES.deepDives.duration}>
        <ProductDeepDives />
      </Sequence>

      {/* ── Scene 4: Value Props ── */}
      <Sequence from={SCENES.valueProps.from} durationInFrames={SCENES.valueProps.duration}>
        <ValuePropsScene />
      </Sequence>

      {/* ── Scene 5: CTA ── */}
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
