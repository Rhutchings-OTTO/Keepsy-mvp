import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND, FRAUNCES, MANROPE } from "../KeepsyReel/fonts";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const OCCASION_FRAMES = 102; // 3.4s per occasion
const WIPE_FRAMES = 12;

const OCCASIONS = [
  {
    src: "images/collection-wedding-canvas.png",
    label: "FOR THE HAPPY COUPLE",
    product: "A personalised wedding canvas",
  },
  {
    src: "images/collection-newbaby-hoodie.png",
    label: "FOR NEW MUMS & DADS",
    product: "A keepsake they'll treasure",
  },
  {
    src: "images/collection-pet-mug.png",
    label: "FOR PET LOVERS",
    product: "Their best friend, on a mug",
  },
  {
    src: "images/collection-newhome-canvas.png",
    label: "FOR NEW HOMEOWNERS",
    product: "Their home, turned into art",
  },
  {
    src: "images/collection-hobby-tshirt.png",
    label: "FOR THE ONE WHO HAS EVERYTHING",
    product: "Something they'll actually love",
  },
];

interface OccasionCardProps {
  occasion: (typeof OCCASIONS)[number];
  localFrame: number;
  fps: number;
  isLast: boolean;
  index: number;
}

const OccasionCard: React.FC<OccasionCardProps> = ({
  occasion,
  localFrame,
  fps,
  isLast,
  index,
}) => {
  // Image slides in from right
  const slideSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 160, mass: 0.7 },
    from: 0,
    to: 1,
  });
  const slideX   = interpolate(slideSpring, [0, 1], [320, 0]);
  const imgOpacity = interpolate(slideSpring, [0, 0.5], [0, 1], clamp);

  // Label fades down from top
  const labelSpring = spring({
    frame: Math.max(0, localFrame - 10),
    fps,
    config: { damping: 200, stiffness: 140, mass: 0.75 },
    from: 0,
    to: 1,
  });
  const labelOpacity = interpolate(labelSpring, [0, 1], [0, 1]);
  const labelY       = interpolate(labelSpring, [0, 1], [-24, 0]);

  // Terracotta underline grows under label
  const underlineWidth = interpolate(localFrame, [18, 45], [0, 180], clamp);

  // Product text fades in
  const productSpring = spring({
    frame: Math.max(0, localFrame - 20),
    fps,
    config: { damping: 200, stiffness: 120, mass: 0.8 },
    from: 0,
    to: 1,
  });
  const productOpacity = interpolate(productSpring, [0, 1], [0, 1]);
  const productY       = interpolate(productSpring, [0, 1], [20, 0]);

  // Progress dots
  const dotProgress = interpolate(localFrame, [12, 30], [0, 1], clamp);

  // Exit wipe
  const exitStart = OCCASION_FRAMES - WIPE_FRAMES;
  const isExiting = !isLast && localFrame >= exitStart;
  const wl = localFrame - exitStart;
  const wipeHalf = WIPE_FRAMES / 2;
  const wipeIn  = interpolate(wl, [0, wipeHalf], [0, 1], clamp);
  const wipeOut = interpolate(wl, [wipeHalf, WIPE_FRAMES], [0, 1], clamp);

  return (
    <AbsoluteFill>
      {/* Full-bleed image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: imgOpacity,
          transform: `translateX(${slideX}px)`,
        }}
      >
        <Img
          src={staticFile(occasion.src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            display: "block",
          }}
        />
        {/* Dark gradient top-to-bottom for legibility */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(45,41,38,0.62) 0%, transparent 32%, transparent 55%, rgba(45,41,38,0.72) 100%)",
          }}
        />
      </div>

      {/* Top label area */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 64,
          right: 64,
          opacity: labelOpacity,
          transform: `translateY(${labelY}px)`,
        }}
      >
        {/* Occasion label */}
        <div
          style={{
            fontFamily: MANROPE,
            fontWeight: 600,
            fontSize: 28,
            color: BRAND.terracotta,
            letterSpacing: "4px",
            textTransform: "uppercase" as const,
            marginBottom: 12,
          }}
        >
          {occasion.label}
        </div>

        {/* Terracotta underline */}
        <div
          style={{
            width: underlineWidth,
            height: 3,
            backgroundColor: BRAND.terracotta,
            borderRadius: 2,
          }}
        />
      </div>

      {/* Progress dots */}
      <div
        style={{
          position: "absolute",
          top: 220,
          left: 64,
          display: "flex",
          gap: 8,
          opacity: dotProgress,
        }}
      >
        {OCCASIONS.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === index ? 28 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i === index ? BRAND.cream : "rgba(255,254,249,0.4)",
            }}
          />
        ))}
      </div>

      {/* Bottom product text */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "0 64px 100px",
          opacity: productOpacity,
          transform: `translateY(${productY}px)`,
        }}
      >
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 72,
            color: BRAND.white,
            lineHeight: 1.08,
            letterSpacing: "-1.5px",
            marginBottom: 0,
          }}
        >
          {occasion.product}
        </div>
      </div>

      {/* Terracotta wipe exit */}
      {isExiting && (
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: wipeOut > 0 ? `${wipeOut * 100}%` : 0,
            width:
              wipeOut > 0
                ? `${(1 - wipeOut) * 100}%`
                : `${wipeIn * 100}%`,
            backgroundColor: BRAND.terracotta,
            zIndex: 50,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

export const OccasionCarousel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const occasionIndex = Math.min(OCCASIONS.length - 1, Math.floor(frame / OCCASION_FRAMES));
  const localFrame    = frame % OCCASION_FRAMES;

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.ink }}>
      <OccasionCard
        key={occasionIndex}
        occasion={OCCASIONS[occasionIndex]}
        localFrame={localFrame}
        fps={fps}
        isLast={occasionIndex === OCCASIONS.length - 1}
        index={occasionIndex}
      />
    </AbsoluteFill>
  );
};
