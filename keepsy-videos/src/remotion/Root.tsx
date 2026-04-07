import React from "react";
import { Composition } from "remotion";
import {
  COMP_NAME,
  defaultMyCompProps,
  DURATION_IN_FRAMES,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "../../types/constants";
import { Main } from "./MyComp/Main";
import { NextLogo } from "./MyComp/NextLogo";
import { KeepsyReel } from "./compositions/KeepsyReel";
import { KeepsyOccasions } from "./compositions/KeepsyOccasions";
import { KeepsyProducts } from "./compositions/KeepsyProducts";
import { KeepsyTransformation } from "./compositions/KeepsyTransformation";
import { KeepsyGuilty } from "./compositions/KeepsyGuilty";
import { KeepsyQuiz } from "./compositions/KeepsyQuiz";
import { KeepsyCountdown } from "./compositions/KeepsyCountdown";
import { KeepsyFounders } from "./compositions/KeepsyFounders";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ── Keepsy Instagram Reel / TikTok (1080×1920, 35 s) ── */}
      <Composition
        id="KeepsyReel"
        component={KeepsyReel}
        durationInFrames={1050}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* ── Keepsy Products (1080×1920, 35 s) ── */}
      <Composition
        id="KeepsyProducts"
        component={KeepsyProducts}
        durationInFrames={1050}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* ── Keepsy Occasions (1080×1920, 35 s) ── */}
      <Composition
        id="KeepsyOccasions"
        component={KeepsyOccasions}
        durationInFrames={1050}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* ── Keepsy Transformation Story (1080×1920, 35 s) ── */}
      <Composition
        id="KeepsyTransformation"
        component={KeepsyTransformation}
        durationInFrames={1050}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* ── Keepsy Guilty Pleasure (1080×1920, 20 s) ── */}
      <Composition
        id="KeepsyGuilty"
        component={KeepsyGuilty}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* ── Keepsy Countdown (1080×1920, 20 s) ── */}
      <Composition
        id="KeepsyCountdown"
        component={KeepsyCountdown}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* ── Keepsy Quiz (1080×1920, 30 s) ── */}
      <Composition
        id="KeepsyQuiz"
        component={KeepsyQuiz}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* ── Keepsy Founders (1080×1920, 35 s) ── */}
      <Composition
        id="KeepsyFounders"
        component={KeepsyFounders}
        durationInFrames={1050}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* ── Original scaffold compositions (kept for reference) ── */}
      <Composition
        id={COMP_NAME}
        component={Main}
        durationInFrames={DURATION_IN_FRAMES}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={defaultMyCompProps}
      />
      <Composition
        id="NextLogo"
        component={NextLogo}
        durationInFrames={300}
        fps={30}
        width={140}
        height={140}
        defaultProps={{ outProgress: 0 }}
      />
    </>
  );
};
