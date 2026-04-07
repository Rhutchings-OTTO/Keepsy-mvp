import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { BRAND } from "../KeepsyReel/fonts";
import { FoundersScene } from "./FoundersScene";
import { OriginScene } from "./OriginScene";
import { WhatScene } from "./WhatScene";
import { QuoteScene } from "./QuoteScene";
import { ValuesScene } from "./ValuesScene";
import { ClosingScene } from "./ClosingScene";

// 35 s @ 30 fps = 1050 frames
// Scene 1 Founders: from=0,   duration=180 (6s)
// Scene 2 Origin:   from=180, duration=210 (7s)
// Scene 3 What:     from=390, duration=210 (7s)
// Scene 4 Quote:    from=600, duration=210 (7s)
// Scene 5 Values:   from=810, duration=120 (4s)
// Scene 6 Closing:  from=930, duration=120 (4s)
// Total: 1050fr ✓

const FLASH_RANGES: [number, number][] = [
  [177, 182],
  [387, 392],
  [597, 602],
  [807, 812],
  [927, 932],
];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const KeepsyFounders: React.FC = () => {
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
    <AbsoluteFill style={{ backgroundColor: BRAND.cream }}>
      <Sequence from={0} durationInFrames={180}>
        <FoundersScene />
      </Sequence>

      <Sequence from={180} durationInFrames={210}>
        <OriginScene />
      </Sequence>

      <Sequence from={390} durationInFrames={210}>
        <WhatScene />
      </Sequence>

      <Sequence from={600} durationInFrames={210}>
        <QuoteScene />
      </Sequence>

      <Sequence from={810} durationInFrames={120}>
        <ValuesScene />
      </Sequence>

      <Sequence from={930} durationInFrames={120}>
        <ClosingScene />
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
