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

const PRODUCT_FRAMES = 120; // 4s per product
const WIPE_FRAMES    = 10;

// Eyebrow badge colours
const BADGE_COLOURS: Record<string, string> = {
  BESTSELLER: BRAND.terracotta,
  POPULAR:    BRAND.forest,
  NEW:        BRAND.gold,
};

const PRODUCTS = [
  {
    src:     "images/collection-newbaby-card.png",
    eyebrow: "BESTSELLER",
    title:   "Personalised Greeting Cards",
    price:   "From £6.99",
  },
  {
    src:     "images/collection-pet-mug.png",
    eyebrow: "BESTSELLER",
    title:   "Personalised Mugs",
    price:   "From £14.99",
  },
  {
    src:     "images/collection-hobby-tshirt.png",
    eyebrow: "POPULAR",
    title:   "Personalised T-Shirts",
    price:   "From £29.99",
  },
  {
    src:     "images/collection-pet-hoodie.png",
    eyebrow: "BESTSELLER",
    title:   "Personalised Hoodies",
    price:   "From £44.99",
  },
  {
    src:     "images/collection-wedding-canvas.png",
    eyebrow: "NEW",
    title:   "Personalised Canvases",
    price:   "From £79.99",
  },
];

interface ProductCardProps {
  product: (typeof PRODUCTS)[number];
  localFrame: number;
  fps: number;
  isLast: boolean;
}

// Split-screen card: image fills top 58%, cream text area below
const ProductCard: React.FC<ProductCardProps> = ({
  product,
  localFrame,
  fps,
  isLast,
}) => {
  // Whole card slides up on enter
  const enterSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 160, mass: 0.75 },
    from: 0,
    to: 1,
  });
  const slideY  = interpolate(enterSpring, [0, 1], [180, 0]);
  const opacity = interpolate(enterSpring, [0, 0.5], [0, 1], clamp);

  // Eyebrow pops in
  const eyebrowSpring = spring({
    frame: Math.max(0, localFrame - 10),
    fps,
    config: { damping: 220, stiffness: 280, mass: 0.5 },
    from: 0,
    to: 1,
  });
  const eyebrowScale = interpolate(eyebrowSpring, [0, 1], [0.7, 1]);
  const eyebrowOp    = interpolate(eyebrowSpring, [0, 0.6], [0, 1], clamp);

  // Title springs in
  const titleSpring = spring({
    frame: Math.max(0, localFrame - 18),
    fps,
    config: { damping: 200, stiffness: 140, mass: 0.8 },
    from: 0,
    to: 1,
  });
  const titleY  = interpolate(titleSpring, [0, 1], [24, 0]);
  const titleOp = interpolate(titleSpring, [0, 1], [0, 1]);

  // Price fades in
  const priceOp = interpolate(localFrame, [26, 42], [0, 1], clamp);

  // Button slides up
  const btnSpring = spring({
    frame: Math.max(0, localFrame - 32),
    fps,
    config: { damping: 200, stiffness: 140, mass: 0.75 },
    from: 0,
    to: 1,
  });
  const btnY  = interpolate(btnSpring, [0, 1], [28, 0]);
  const btnOp = interpolate(btnSpring, [0, 1], [0, 1]);

  // Wipe exit
  const exitStart = PRODUCT_FRAMES - WIPE_FRAMES;
  const isExiting = !isLast && localFrame >= exitStart;
  const wl       = localFrame - exitStart;
  const wipeHalf = WIPE_FRAMES / 2;
  const wipeIn   = interpolate(wl, [0, wipeHalf], [0, 1], clamp);
  const wipeOut  = interpolate(wl, [wipeHalf, WIPE_FRAMES], [0, 1], clamp);

  const badgeColour = BADGE_COLOURS[product.eyebrow] ?? BRAND.terracotta;

  return (
    <AbsoluteFill
      style={{
        opacity,
        transform: `translateY(${slideY}px)`,
      }}
    >
      {/* Top: lifestyle image (58% height) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "58%",
          overflow: "hidden",
        }}
      >
        <Img
          src={staticFile(product.src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
            display: "block",
          }}
        />
        {/* Soft bottom fade into cream */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 100,
            background: `linear-gradient(to bottom, transparent, ${BRAND.cream})`,
          }}
        />
      </div>

      {/* Bottom: cream text area (42% height) */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "44%",
          backgroundColor: BRAND.cream,
          padding: "28px 64px 80px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          gap: 0,
        }}
      >
        {/* Eyebrow badge */}
        <div
          style={{
            display: "inline-flex",
            alignSelf: "flex-start",
            marginBottom: 18,
            opacity: eyebrowOp,
            transform: `scale(${eyebrowScale})`,
            transformOrigin: "left center",
          }}
        >
          <div
            style={{
              backgroundColor: badgeColour,
              borderRadius: 100,
              padding: "8px 24px",
              fontFamily: MANROPE,
              fontWeight: 600,
              fontSize: 24,
              color: BRAND.white,
              letterSpacing: "2px",
              textTransform: "uppercase" as const,
            }}
          >
            {product.eyebrow}
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 66,
            color: BRAND.ink,
            lineHeight: 1.05,
            letterSpacing: "-1.5px",
            marginBottom: 16,
            opacity: titleOp,
            transform: `translateY(${titleY}px)`,
          }}
        >
          {product.title}
        </div>

        {/* Price */}
        <div
          style={{
            fontFamily: MANROPE,
            fontWeight: 700,
            fontSize: 44,
            color: BRAND.ink,
            letterSpacing: "-0.5px",
            marginBottom: 28,
            opacity: priceOp,
          }}
        >
          {product.price}
        </div>

        {/* Shop now button */}
        <div
          style={{
            opacity: btnOp,
            transform: `translateY(${btnY}px)`,
            display: "inline-flex",
            alignSelf: "flex-start",
          }}
        >
          <div
            style={{
              backgroundColor: BRAND.terracotta,
              borderRadius: 100,
              padding: "16px 44px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                fontFamily: MANROPE,
                fontWeight: 600,
                fontSize: 32,
                color: BRAND.white,
                letterSpacing: "-0.2px",
              }}
            >
              Shop now →
            </span>
          </div>
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

export const ProductDeepDives: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const productIndex = Math.min(PRODUCTS.length - 1, Math.floor(frame / PRODUCT_FRAMES));
  const localFrame   = frame % PRODUCT_FRAMES;

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.cream }}>
      <ProductCard
        key={productIndex}
        product={PRODUCTS[productIndex]}
        localFrame={localFrame}
        fps={fps}
        isLast={productIndex === PRODUCTS.length - 1}
      />
    </AbsoluteFill>
  );
};
