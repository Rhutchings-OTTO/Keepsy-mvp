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

const PRODUCT_FRAMES = 100; // each product = 100 frames ≈ 3.33s
const WIPE_FRAMES = 10;    // terracotta wipe takes 10 frames

const PRODUCTS = [
  {
    src: "images/collection-wedding-canvas.png",
    name: "Personalised Canvases",
    price: "£79.99",
    label: "For the home",
  },
  {
    src: "images/collection-hobby-tshirt.png",
    name: "Personalised T-Shirts",
    price: "£29.99",
    label: "Wearable art",
  },
  {
    src: "images/collection-pet-mug.png",
    name: "Personalised Mugs",
    price: "£14.99",
    label: "Every morning",
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
  // Image spring-up enter
  const enterSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 180, stiffness: 130, mass: 0.75 },
    from: 0,
    to: 1,
  });
  const imageY = interpolate(enterSpring, [0, 1], [120, 0]);
  const imageScale = interpolate(enterSpring, [0, 1], [0.92, 1]);
  const imageOpacity = interpolate(enterSpring, [0, 1], [0, 1]);

  // Overlay bar slides up
  const barSpring = spring({
    frame: Math.max(0, localFrame - 8),
    fps,
    config: { damping: 200, stiffness: 140, mass: 0.7 },
    from: 0,
    to: 1,
  });
  const barY = interpolate(barSpring, [0, 1], [60, 0]);
  const barOpacity = interpolate(barSpring, [0, 1], [0, 1]);

  // Label fades in
  const labelOpacity = interpolate(localFrame, [12, 26], [0, 1], clamp);

  // Exit wipe (terracotta wipe from left, only if not last product)
  const exitStart = PRODUCT_FRAMES - WIPE_FRAMES;
  const isExiting = !isLast && localFrame >= exitStart;
  const wipeHalf = WIPE_FRAMES / 2;
  const wipeLocalFrame = localFrame - exitStart;
  const wipeInProgress = interpolate(wipeLocalFrame, [0, wipeHalf], [0, 1], clamp);
  const wipeOutProgress = interpolate(wipeLocalFrame, [wipeHalf, WIPE_FRAMES], [0, 1], clamp);

  return (
    <AbsoluteFill>
      {/* Full-bleed product image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: imageOpacity,
          transform: `translateY(${imageY}px) scale(${imageScale})`,
          transformOrigin: "bottom center",
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
        {/* Subtle dark vignette at bottom for overlay legibility */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 400,
            background: `linear-gradient(to top, rgba(43,64,56,0.88) 0%, rgba(43,64,56,0.4) 50%, transparent 100%)`,
          }}
        />
      </div>

      {/* Product info bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "40px 64px 72px",
          opacity: barOpacity,
          transform: `translateY(${barY}px)`,
        }}
      >
        {/* Small label */}
        <div
          style={{
            fontFamily: MANROPE,
            fontWeight: 600,
            fontSize: 26,
            color: BRAND.gold,
            letterSpacing: "2.5px",
            textTransform: "uppercase",
            marginBottom: 12,
            opacity: labelOpacity,
          }}
        >
          {product.label}
        </div>

        {/* Product name */}
        <div
          style={{
            fontFamily: FRAUNCES,
            fontWeight: 700,
            fontSize: 68,
            color: BRAND.white,
            lineHeight: 1.05,
            letterSpacing: "-1.5px",
            marginBottom: 14,
          }}
        >
          {product.name}
        </div>

        {/* Price row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              fontFamily: MANROPE,
              fontWeight: 700,
              fontSize: 50,
              color: BRAND.white,
              letterSpacing: "-0.5px",
            }}
          >
            {product.price}
          </div>
          <div
            style={{
              backgroundColor: BRAND.terracotta,
              borderRadius: 100,
              padding: "10px 28px",
              fontFamily: MANROPE,
              fontWeight: 600,
              fontSize: 28,
              color: BRAND.white,
              letterSpacing: "-0.2px",
            }}
          >
            Shop now
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
            left: wipeOutProgress > 0 ? `${wipeOutProgress * 100}%` : 0,
            width:
              wipeOutProgress > 0
                ? `${(1 - wipeOutProgress) * 100}%`
                : `${wipeInProgress * 100}%`,
            backgroundColor: BRAND.terracotta,
            zIndex: 50,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

export const ProductShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const productIndex = Math.min(2, Math.floor(frame / PRODUCT_FRAMES));
  const localFrame = frame % PRODUCT_FRAMES;
  const product = PRODUCTS[productIndex];

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.ink }}>
      <ProductCard
        key={productIndex}
        product={product}
        localFrame={localFrame}
        fps={fps}
        isLast={productIndex === PRODUCTS.length - 1}
      />
    </AbsoluteFill>
  );
};
