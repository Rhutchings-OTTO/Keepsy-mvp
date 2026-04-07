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
import { BRAND, FRAUNCES, MANROPE } from "./fonts";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Phase timings (local frames, 180 total)
const PAGE1_END = 84;   // homepage 0–83  (~3 s)
const PAGE2_START = 90; // collection 90–179 (~3 s) — terracotta cut 84–89

// ─── Shared prop for phone frame ───────────────────────────────────────────

interface PhoneFrameProps {
  children: React.ReactNode;
  scale?: number;
  opacity?: number;
}

const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  scale = 1,
  opacity = 1,
}) => (
  <div
    style={{
      width: 500,
      height: 900,
      borderRadius: 52,
      border: `12px solid ${BRAND.ink}`,
      overflow: "hidden",
      position: "relative",
      backgroundColor: BRAND.cream,
      boxShadow:
        "0 50px 100px rgba(45,41,38,0.28), 0 20px 40px rgba(45,41,38,0.15)",
      transform: `scale(${scale})`,
      opacity,
      flexShrink: 0,
    }}
  >
    {/* Phone notch */}
    <div
      style={{
        position: "absolute",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: 130,
        height: 32,
        backgroundColor: BRAND.ink,
        borderRadius: "0 0 22px 22px",
        zIndex: 20,
      }}
    />
    {children}
  </div>
);

// ─── Placeholder screen (shown until real screenshots are added) ────────────

const PlaceholderScreen: React.FC<{ scrollY: number; pageLabel: string; items: string[] }> = ({
  scrollY,
  pageLabel,
  items,
}) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      overflow: "hidden",
      position: "relative",
      backgroundColor: BRAND.cream,
    }}
  >
    <div
      style={{
        transform: `translateY(${scrollY}px)`,
        padding: "52px 20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {/* Hero block */}
      <div
        style={{
          backgroundColor: BRAND.creamDark,
          borderRadius: 16,
          padding: "28px 20px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 22,
            color: BRAND.ink,
            letterSpacing: "-0.5px",
          }}
        >
          Keepsy
        </div>
        <div
          style={{
            fontFamily: MANROPE,
            fontWeight: 500,
            fontSize: 11,
            color: BRAND.ink,
            opacity: 0.55,
            marginTop: 6,
          }}
        >
          {pageLabel}
        </div>
        <div
          style={{
            marginTop: 14,
            backgroundColor: BRAND.terracotta,
            borderRadius: 8,
            padding: "8px 16px",
            display: "inline-block",
            fontFamily: MANROPE,
            fontWeight: 600,
            fontSize: 11,
            color: BRAND.white,
          }}
        >
          Start creating
        </div>
      </div>
      {/* Simulated product cards */}
      {items.map((item) => (
        <div
          key={item}
          style={{
            backgroundColor: BRAND.creamDark,
            borderRadius: 12,
            height: 64,
            display: "flex",
            alignItems: "center",
            paddingLeft: 16,
          }}
        >
          <div
            style={{
              fontFamily: MANROPE,
              fontWeight: 600,
              fontSize: 12,
              color: BRAND.ink,
            }}
          >
            {item}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Screen content ─────────────────────────────────────────────────────────
// When you have real screenshots, swap the PlaceholderScreen for:
//   <Img src={staticFile(src)} style={{ width: "100%", objectFit: "cover",
//     objectPosition: "top", transform: `translateY(${scrollY}px)` }} />

interface ScreenContentProps {
  src: string;
  scrollY: number;
  pageLabel: string;
  items: string[];
  useRealScreenshot: boolean;
}

const ScreenContent: React.FC<ScreenContentProps> = ({
  src,
  scrollY,
  pageLabel,
  items,
  useRealScreenshot,
}) => {
  if (useRealScreenshot) {
    return (
      <div style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative" }}>
        <Img
          src={staticFile(src)}
          style={{
            width: "100%",
            objectFit: "cover",
            objectPosition: "top",
            transform: `translateY(${scrollY}px)`,
            display: "block",
          }}
        />
      </div>
    );
  }
  return <PlaceholderScreen scrollY={scrollY} pageLabel={pageLabel} items={items} />;
};

// ─── Main component ─────────────────────────────────────────────────────────

// Set to false to use branded placeholder screens instead of real screenshots
const USE_REAL_SCREENSHOTS = true;

export const WebsiteFlythrough: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isPage1 = frame < PAGE1_END;
  const isCutting = frame >= PAGE1_END && frame < PAGE2_START;
  const isPage2 = frame >= PAGE2_START;

  // Page 1 spring enter
  const page1Spring = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 130, mass: 0.7 },
    from: 0,
    to: 1,
  });
  const page1Scale = interpolate(page1Spring, [0, 1], [0.88, 1]);
  const page1Opacity = interpolate(page1Spring, [0, 1], [0, 1]);
  const page1Scroll = interpolate(frame, [10, PAGE1_END], [0, -200], clamp);

  // Page 2 spring enter
  const page2LocalFrame = Math.max(0, frame - PAGE2_START);
  const page2Spring = spring({
    frame: page2LocalFrame,
    fps,
    config: { damping: 200, stiffness: 130, mass: 0.7 },
    from: 0,
    to: 1,
  });
  const page2Scale = interpolate(page2Spring, [0, 1], [0.88, 1]);
  const page2Opacity = interpolate(page2Spring, [0, 1], [0, 1]);
  const page2Scroll = interpolate(page2LocalFrame, [8, 75], [0, -200], clamp);

  // keepsy.store URL bar
  const urlOpacity = interpolate(frame, [8, 22], [0, 1], clamp);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(160deg, ${BRAND.cream} 0%, ${BRAND.creamDark} 100%)`,
        }}
      />

      {/* Page 1: Homepage */}
      {isPage1 && (
        <div style={{ position: "absolute" }}>
          <PhoneFrame scale={page1Scale} opacity={page1Opacity}>
            <ScreenContent
              src="images/website-homepage.png"
              scrollY={page1Scroll}
              pageLabel="Personalised gifts, beautifully made"
              items={["Canvas Prints", "Hoodies", "Mugs", "Cards", "T-Shirts"]}
              useRealScreenshot={USE_REAL_SCREENSHOTS}
            />
          </PhoneFrame>
        </div>
      )}

      {/* Terracotta cut flash between pages */}
      {isCutting && (
        <AbsoluteFill
          style={{ backgroundColor: BRAND.terracotta, opacity: 0.9, zIndex: 10 }}
        />
      )}

      {/* Page 2: Collection */}
      {isPage2 && (
        <div style={{ position: "absolute" }}>
          <PhoneFrame scale={page2Scale} opacity={page2Opacity}>
            <ScreenContent
              src="images/website-collection.png"
              scrollY={page2Scroll}
              pageLabel="Our Collection"
              items={["Personalised Canvas", "Personalised Hoodie", "Personalised Mug", "Greeting Cards", "T-Shirts"]}
              useRealScreenshot={USE_REAL_SCREENSHOTS}
            />
          </PhoneFrame>
        </div>
      )}

      {/* keepsy.store URL pill */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: urlOpacity,
          zIndex: 20,
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(45,41,38,0.85)",
            borderRadius: 100,
            padding: "14px 40px",
          }}
        >
          <span
            style={{
              fontFamily: MANROPE,
              fontWeight: 600,
              fontSize: 34,
              color: BRAND.terracotta,
              letterSpacing: "0.5px",
            }}
          >
            keepsy.store
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
