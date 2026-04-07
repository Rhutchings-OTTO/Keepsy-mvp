import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
} from "remotion";
import { BRAND } from "../KeepsyReel/fonts";
import { CTAScene } from "./CTAScene";
import { HookScene } from "./HookScene";
import { PhotoScene } from "./PhotoScene";
import { ProductScene } from "./ProductScene";
import { SocialProofScene } from "./SocialProofScene";
import { TransformScene } from "./TransformScene";

// ─── Scene timings (frames at 30fps) ────────────────────────────────────────
//  Scene 1 — Hook            :   0 –  89  ( 90 frames =  3.0 s)
//  Scene 2 — Photo           :  90 – 209  (120 frames =  4.0 s)
//  Scene 3 — Transformation  : 210 – 359  (150 frames =  5.0 s)
//  Scene 4 — Products        : 360 – 659  (300 frames = 10.0 s)
//  Scene 5 — Social Proof    : 660 – 809  (150 frames =  5.0 s)
//  Scene 6 — CTA             : 810 – 1049 (240 frames =  8.0 s)
//  Total: 1050 frames = 35 s

export const SCENES = {
  hook:        { from: 0,   duration: 90  },
  photo:       { from: 90,  duration: 120 },
  transform:   { from: 210, duration: 150 },
  products:    { from: 360, duration: 300 },
  socialProof: { from: 660, duration: 150 },
  cta:         { from: 810, duration: 240 },
} as const;

// Terracotta flash transitions between scenes.
// Photo → Transform is skipped: TransformScene opens with its own terracotta wipe.
const FLASH_RANGES: [number, number][] = [
  [87,  92],  // Hook → Photo
  [357, 362], // Transform → Products
  [657, 662], // Products → Social Proof
  [807, 812], // Social Proof → CTA
];

export const KeepsyTransformation: React.FC = () => {
  const frame = useCurrentFrame();
  const isFlashing = FLASH_RANGES.some(([a, b]) => frame >= a && frame <= b);

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.cream }}>
      {/* ── Scene 1: Hook ── */}
      <Sequence from={SCENES.hook.from} durationInFrames={SCENES.hook.duration}>
        <HookScene />
      </Sequence>

      {/* ── Scene 2: Photo ── */}
      <Sequence from={SCENES.photo.from} durationInFrames={SCENES.photo.duration}>
        <PhotoScene />
      </Sequence>

      {/* ── Scene 3: Transformation ── */}
      <Sequence from={SCENES.transform.from} durationInFrames={SCENES.transform.duration}>
        <TransformScene />
      </Sequence>

      {/* ── Scene 4: Product Showcase ── */}
      <Sequence from={SCENES.products.from} durationInFrames={SCENES.products.duration}>
        <ProductScene />
      </Sequence>

      {/* ── Scene 5: Social Proof ── */}
      <Sequence from={SCENES.socialProof.from} durationInFrames={SCENES.socialProof.duration}>
        <SocialProofScene />
      </Sequence>

      {/* ── Scene 6: CTA ── */}
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
