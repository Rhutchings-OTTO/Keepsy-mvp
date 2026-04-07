import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { BRAND } from "../KeepsyReel/fonts";
import { HookScene } from "./HookScene";
import { QuestionsScene } from "./QuestionsScene";
import { ScoreScene } from "./ScoreScene";
import { CTAScene } from "./CTAScene";

// 30 s @ 30 fps = 900 frames
// Scene 1 Hook:      from=0,   duration=90  (3s)
// Scene 2 Questions: from=90,  duration=480 (16s, 4×120fr)
// Scene 3 Score:     from=570, duration=180 (6s)
// Scene 4 CTA:       from=750, duration=150 (5s)
// Total: 900fr ✓

const FLASH_RANGES: [number, number][] = [
  [87,  92],
  [567, 572],
  [747, 752],
];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const KeepsyQuiz: React.FC = () => {
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
      <Sequence from={0} durationInFrames={90}>
        <HookScene />
      </Sequence>

      <Sequence from={90} durationInFrames={480}>
        <QuestionsScene />
      </Sequence>

      <Sequence from={570} durationInFrames={180}>
        <ScoreScene />
      </Sequence>

      <Sequence from={750} durationInFrames={150}>
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
