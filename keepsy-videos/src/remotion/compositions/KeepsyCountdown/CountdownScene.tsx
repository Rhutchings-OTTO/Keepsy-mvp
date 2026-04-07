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

const ITEM_FRAMES = 72; // 2.4s per item
const EXIT_START  = 58; // last 14 frames slide out
const WIPE_FRAMES = 8;

const ITEMS = [
  { num: 5, text: "You bought it in a panic at the airport",          bg: BRAND.cream     },
  { num: 4, text: "You googled 'gifts for people who have everything'", bg: BRAND.creamDark },
  { num: 3, text: "It came in a brown Amazon box",                    bg: BRAND.cream     },
  { num: 2, text: "They said 'oh you shouldn't have'… and meant it",  bg: BRAND.creamDark },
  { num: 1, text: "It's gathering dust in a drawer somewhere",        bg: BRAND.cream     },
] as const;

interface ItemCardProps {
  item: typeof ITEMS[number];
  localFrame: number;
  fps: number;
  isLast: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, localFrame, fps, isLast }) => {
  // Slide in from left
  const enterSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 260, stiffness: 220, mass: 0.55 },
    from: 0,
    to: 1,
  });
  const slideX  = interpolate(enterSpring, [0, 1], [-320, 0]);
  const opacity = interpolate(enterSpring, [0, 0.4], [0, 1], clamp);

  // Number pops in with extra spring
  const numSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 180, stiffness: 350, mass: 0.45 },
    from: 0,
    to: 1,
  });
  const numScale = interpolate(numSpring, [0, 1], [0.5, 1]);

  // Slide up and off screen on exit (not for last item)
  const isExiting = !isLast && localFrame >= EXIT_START;
  const exitSpring = spring({
    frame: Math.max(0, localFrame - EXIT_START),
    fps,
    config: { damping: 200, stiffness: 280, mass: 0.5 },
    from: 0,
    to: 1,
  });
  const exitY = isExiting ? interpolate(exitSpring, [0, 1], [0, -380]) : 0;
  const exitOp = isExiting ? interpolate(exitSpring, [0, 0.6], [1, 0], clamp) : 1;

  // Terracotta wipe at the very end (if not sliding up)
  const wipeStart = ITEM_FRAMES - WIPE_FRAMES;
  const isWiping = !isLast && !isExiting && localFrame >= wipeStart;
  const wl = localFrame - wipeStart;
  const wipeHalf = WIPE_FRAMES / 2;
  const wipeIn  = interpolate(wl, [0, wipeHalf], [0, 1], clamp);
  const wipeOut = interpolate(wl, [wipeHalf, WIPE_FRAMES], [0, 1], clamp);

  // Accent line grows in under the number
  const accentW = interpolate(localFrame, [8, 32], [0, 60], clamp);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: item.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 72px",
        overflow: "hidden",
      }}
    >
      {/* Main content row */}
      <div
        style={{
          opacity: opacity * exitOp,
          transform: `translateX(${slideX}px) translateY(${exitY}px)`,
          display: "flex",
          alignItems: "center",
          gap: 48,
          width: "100%",
        }}
      >
        {/* Large number */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontFamily: FRAUNCES,
              fontWeight: 700,
              fontSize: 200,
              color: BRAND.terracotta,
              lineHeight: 1,
              letterSpacing: "-6px",
              transform: `scale(${numScale})`,
              transformOrigin: "center bottom",
            }}
          >
            {item.num}
          </div>
          {/* Accent line under number */}
          <div
            style={{
              width: accentW,
              height: 5,
              backgroundColor: BRAND.terracotta,
              borderRadius: 2,
              marginTop: -8,
            }}
          />
        </div>

        {/* Text */}
        <div
          style={{
            flex: 1,
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 58,
            color: BRAND.ink,
            lineHeight: 1.12,
            letterSpacing: "-1.2px",
          }}
        >
          {item.text}
        </div>
      </div>

      {/* Terracotta wipe exit */}
      {isWiping && (
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: wipeOut > 0 ? `${wipeOut * 100}%` : 0,
            width: wipeOut > 0 ? `${(1 - wipeOut) * 100}%` : `${wipeIn * 100}%`,
            backgroundColor: BRAND.terracotta,
            zIndex: 50,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

export const CountdownScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const itemIndex  = Math.min(ITEMS.length - 1, Math.floor(frame / ITEM_FRAMES));
  const localFrame = frame % ITEM_FRAMES;

  return (
    <AbsoluteFill>
      <ItemCard
        key={itemIndex}
        item={ITEMS[itemIndex]}
        localFrame={localFrame}
        fps={fps}
        isLast={itemIndex === ITEMS.length - 1}
      />
    </AbsoluteFill>
  );
};
