import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { BRAND } from "../KeepsyReel/fonts";
import { HookScene } from "./HookScene";
import { RoastScene } from "./RoastScene";
import { TurnScene } from "./TurnScene";
import { TeaseScene } from "./TeaseScene";
import { CTAScene } from "./CTAScene";

// 20 s @ 30 fps = 600 frames
// Scene 1 Hook:   from=0,   duration=90  (3s)
// Scene 2 Roast:  from=90,  duration=180 (6s, 3×60fr)
// Scene 3 Turn:   from=270, duration=150 (5s)
// Scene 4 Tease:  from=420, duration=120 (4s)
// Scene 5 CTA:    from=540, duration=60  (2s)
// Total: 600fr ✓

const FLASH_RANGES: [number, number][] = [
  [87,  92],
  [267, 272],
  [417, 422],
  [537, 542],
];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const KeepsyGuilty: React.FC = () => {
  const frame = useCurrentFrame();

  const flashOpacity = FLASH_RANGES.reduce((acc, [start, end]) => {
    if (frame >= start && frame <= end) {
      const mid = (start + end) / 2;
      return Math.max(acc, interpolate(
        frame,
        [start, mid, end],
        [0, 1, 0],
        clamp,
      ));
    }
    return acc;
  }, 0);

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.cream }}>
      <Sequence from={0} durationInFrames={90}>
        <HookScene />
      </Sequence>

      <Sequence from={90} durationInFrames={180}>
        <RoastScene />
      </Sequence>

      <Sequence from={270} durationInFrames={150}>
        <TurnScene />
      </Sequence>

      <Sequence from={420} durationInFrames={120}>
        <TeaseScene />
      </Sequence>

      <Sequence from={540} durationInFrames={60}>
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
