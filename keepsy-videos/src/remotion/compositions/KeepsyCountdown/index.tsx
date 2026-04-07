import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { BRAND } from "../KeepsyReel/fonts";
import { HookScene } from "./HookScene";
import { CountdownScene } from "./CountdownScene";
import { FixScene } from "./FixScene";
import { CTAScene } from "./CTAScene";

// 20 s @ 30 fps = 600 frames
// Scene 1 Hook:      from=0,   duration=60  (2s)
// Scene 2 Countdown: from=60,  duration=360 (12s, 5×72fr)
// Scene 3 Fix:       from=420, duration=90  (3s)
// Scene 4 CTA:       from=510, duration=90  (3s)
// Total: 600fr ✓

const FLASH_RANGES: [number, number][] = [
  [57,  62],
  [417, 422],
  [507, 512],
];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const KeepsyCountdown: React.FC = () => {
  const frame = useCurrentFrame();

  const flashOpacity = FLASH_RANGES.reduce((acc, [start, end]) => {
    if (frame >= start && frame <= end) {
      const mid = (start + end) / 2;
      return Math.max(
        acc,
        interpolate(frame, [start, mid, end], [0, 1, 0], clamp),
      );
    }
    return acc;
  }, 0);

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.forest }}>
      <Sequence from={0} durationInFrames={60}>
        <HookScene />
      </Sequence>

      <Sequence from={60} durationInFrames={360}>
        <CountdownScene />
      </Sequence>

      <Sequence from={420} durationInFrames={90}>
        <FixScene />
      </Sequence>

      <Sequence from={510} durationInFrames={90}>
        <CTAScene />
      </Sequence>

      {/* Terracotta flash at scene boundaries */}
      {flashOpacity > 0 && (
        <AbsoluteFill
          style={{
            backgroundColor: BRAND.terracotta,
            opacity: flashOpacity,
            zIndex: 100,
          }}
        />
      )}
    </AbsoluteFill>
  );
};
