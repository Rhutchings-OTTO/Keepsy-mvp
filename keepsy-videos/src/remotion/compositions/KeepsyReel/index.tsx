import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { CTAOutro } from "./CTAOutro";
import { HowItWorks } from "./HowItWorks";
import { LogoIntro } from "./LogoIntro";
import { ProductShowcase } from "./ProductShowcase";
import { WebsiteFlythrough } from "./WebsiteFlythrough";
import { BRAND, FRAUNCES } from "./fonts";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// "Gifts like..." bridge overlay — frames 294–314 (21 frames ≈ 0.7 s)
const GiftsLikeBridge: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 8, 22, 30], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "rgba(43,64,56,0.93)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: FRAUNCES,
          fontWeight: 600,
          fontSize: 96,
          color: BRAND.white,
          opacity,
          letterSpacing: "-2px",
          lineHeight: 1,
        }}
      >
        Gifts like…
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene timings (frames at 30fps) ────────────────────────────────────────
//  Scene 1 — Logo Intro         :   0 –  89  ( 90 frames =  3.0 s)
//  Scene 2 — Website Flythrough :  90 – 269  (180 frames =  6.0 s)
//  Scene 3 — How It Works       : 270 – 539  (270 frames =  9.0 s)
//  Bridge  — "Gifts like…"      : 540 – 569  ( 30 frames =  1.0 s)
//  Scene 4 — Product Showcase   : 570 – 869  (300 frames = 10.0 s)
//  Scene 5 — CTA Outro          : 870 – 1049 (180 frames =  6.0 s)
//  Total: 1050 frames = 35 s

export const SCENES = {
  logoIntro:       { from: 0,    duration: 90  },
  flythrough:      { from: 90,   duration: 180 },
  howItWorks:      { from: 270,  duration: 270 },
  giftsLikeBridge: { from: 540,  duration: 30  },
  productShowcase: { from: 570,  duration: 300 },
  ctaOutro:        { from: 870,  duration: 180 },
} as const;

// Terracotta flash frames (straddle each scene boundary)
// The "Gifts like…" bridge is its own visual transition — no flash needed on either side.
const FLASH_RANGES: [number, number][] = [
  [87,  92],  // Logo → Flythrough
  [267, 272], // Flythrough → HowItWorks
  [867, 872], // ProductShowcase → CTA
];

// Drop your background.mp3 into public/audio/ then set this to true
const ENABLE_MUSIC = false;

export const KeepsyReel: React.FC = () => {
  const frame = useCurrentFrame();

  const isFlashing = FLASH_RANGES.some(([a, b]) => frame >= a && frame <= b);

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.cream }}>
      {/* ── Scene 1: Logo Intro ── */}
      <Sequence
        from={SCENES.logoIntro.from}
        durationInFrames={SCENES.logoIntro.duration}
      >
        <LogoIntro />
      </Sequence>

      {/* ── Scene 2: Website Flythrough ── */}
      <Sequence
        from={SCENES.flythrough.from}
        durationInFrames={SCENES.flythrough.duration}
      >
        <WebsiteFlythrough />
      </Sequence>

      {/* ── Scene 3: How It Works ── */}
      <Sequence
        from={SCENES.howItWorks.from}
        durationInFrames={SCENES.howItWorks.duration}
      >
        <HowItWorks />
      </Sequence>

      {/* ── Bridge: "Gifts like…" ── */}
      <Sequence
        from={SCENES.giftsLikeBridge.from}
        durationInFrames={SCENES.giftsLikeBridge.duration}
      >
        <GiftsLikeBridge />
      </Sequence>

      {/* ── Scene 4: Product Showcase ── */}
      <Sequence
        from={SCENES.productShowcase.from}
        durationInFrames={SCENES.productShowcase.duration}
      >
        <ProductShowcase />
      </Sequence>

      {/* ── Scene 5: CTA Outro ── */}
      <Sequence
        from={SCENES.ctaOutro.from}
        durationInFrames={SCENES.ctaOutro.duration}
      >
        <CTAOutro />
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

      {/* ── Background music ──────────────────────────────────────────────────
           Drop your background.mp3 into public/audio/ to enable music.
           Set ENABLE_MUSIC = true below once the file is in place.
           Volume fades in over the first 0.5 s and fades out in the last 2 s.
      ── */}
      {ENABLE_MUSIC && (
        <Audio
          src={staticFile("audio/background.mp3")}
          volume={(f) => {
            if (f < 15) return interpolate(f, [0, 15], [0, 0.72]);
            if (f > 540) return interpolate(f, [540, 600], [0.72, 0]);
            return 0.72;
          }}
        />
      )}
    </AbsoluteFill>
  );
};
