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

const PRODUCT_FRAMES = 75; // each product = 75 frames = 2.5s
const WIPE_FRAMES = 10;

const PRODUCTS = [
  {
    src: "images/collection-wedding-canvas.png",
    name: "Canvases",
    price: "£79.99",
  },
  {
    src: "images/collection-pet-hoodie-black.png",
    name: "Hoodies",
    price: "£44.99",
  },
  {
    src: "images/collection-pet-mug.png",
    name: "Mugs",
    price: "£14.99",
  },
  {
    src: "images/collection-hobby-tshirt.png",
    name: "T-Shirts",
    price: "£29.99",
  },
];

interface ProductCardProps {
  product: (typeof PRODUCTS)[number];
  localFrame: number;
  fps: number;
  isLast: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  localFrame,
  fps,
  isLast,
}) => {
  // Image slides in from right
  const enterSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 180, stiffness: 140, mass: 0.7 },
    from: 0,
    to: 1,
  });
  const slideX   = interpolate(enterSpring, [0, 1], [260, 0]);
  const opacity  = interpolate(enterSpring, [0, 1], [0, 1]);

  // Forest green info bar slides up
  const barSpring = spring({
    frame: Math.max(0, localFrame - 8),
    fps,
    config: { damping: 200, stiffness: 150, mass: 0.65 },
    from: 0,
    to: 1,
  });
  const barY      = interpolate(barSpring, [0, 1], [70, 0]);
  const barOpacity = interpolate(barSpring, [0, 1], [0, 1]);

  // Wipe exit (not for the last product)
  const exitStart = PRODUCT_FRAMES - WIPE_FRAMES;
  const isExiting = !isLast && localFrame >= exitStart;
  const wipeHalf = WIPE_FRAMES / 2;
  const wl = localFrame - exitStart;
  const wipeIn  = interpolate(wl, [0, wipeHalf],  [0, 1], clamp);
  const wipeOut = interpolate(wl, [wipeHalf, WIPE_FRAMES], [0, 1], clamp);

  return (
    <AbsoluteFill>
      {/* Full-bleed image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity,
          transform: `translateX(${slideX}px)`,
        }}
      >
        <Img
          src={staticFile(product.src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            display: "block",
          }}
        />
        {/* Forest green gradient vignette at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 420,
            background:
              "linear-gradient(to top, rgba(43,64,56,0.96) 0%, rgba(43,64,56,0.5) 50%, transparent 100%)",
          }}
        />
      </div>

      {/* Info bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "36px 64px 80px",
          opacity: barOpacity,
          transform: `translateY(${barY}px)`,
        }}
      >
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 600,
            fontSize: 80,
            color: BRAND.white,
            lineHeight: 1.0,
            letterSpacing: "-2px",
            marginBottom: 10,
          }}
        >
          {product.name}
        </div>
        <div
          style={{
            fontFamily: MANROPE,
            fontWeight: 700,
            fontSize: 52,
            color: BRAND.white,
            letterSpacing: "-0.5px",
          }}
        >
          {product.price}
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

export const ProductScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Header title fades in over products for the first 50 frames
  const headerOpacity = interpolate(frame, [0, 18, 50, 65], [0, 1, 1, 0], clamp);
  const headerY = interpolate(
    spring({ frame, fps, config: { damping: 200, stiffness: 120, mass: 0.8 }, from: 0, to: 1 }),
    [0, 1],
    [-30, 0]
  );

  const productIndex = Math.min(3, Math.floor(frame / PRODUCT_FRAMES));
  const localFrame   = frame % PRODUCT_FRAMES;

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.forest }}>
      {/* Product cards */}
      <ProductCard
        key={productIndex}
        product={PRODUCTS[productIndex]}
        localFrame={localFrame}
        fps={fps}
        isLast={productIndex === PRODUCTS.length - 1}
      />

      {/* "Then printed on premium products" header — overlays first product */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "90px 64px 40px",
          background:
            "linear-gradient(to bottom, rgba(249,248,246,0.96) 0%, rgba(249,248,246,0) 100%)",
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
          zIndex: 30,
        }}
      >
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 600,
            fontSize: 52,
            color: BRAND.ink,
            lineHeight: 1.15,
            letterSpacing: "-1px",
          }}
        >
          Then printed on premium products
        </div>
      </div>
    </AbsoluteFill>
  );
};
