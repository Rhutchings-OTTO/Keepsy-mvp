"use client";

import Image from "next/image";
import { motion, type MotionValue } from "framer-motion";
import { InteractiveCard } from "@/components/ui/InteractiveCard";
import { FF } from "@/lib/featureFlags";
import type { HeroLayoutResult } from "@/components/hero/useHeroLayout";

type CardDef = {
  id: string;
  label: string;
  product: string;
  image: string;
};

const CARD_DEFS: CardDef[] = [
  { id: "tee-white", label: "Premium Tee Mockup", product: "T-Shirt", image: "/product-tiles/tee-white.png" },
  { id: "plain-mug", label: "Plain Mug Mockup", product: "Mug", image: "/product-tiles/plain-mug-front.png" },
  { id: "plain-hoodie", label: "Plain Hoodie Mockup", product: "Hoodie", image: "/product-tiles/hoodie-white.png" },
  { id: "plain-card", label: "Plain Card Mockup", product: "Card", image: "/product-tiles/plain-card.png" },
  { id: "christmas-scene", label: "Christmas Scene", product: "Design", image: "/occasion-tiles/christmas-scene.png" },
  { id: "thanksgiving-scene", label: "Thanksgiving Cartoon", product: "Design", image: "/occasion-tiles/thanksgiving-cartoon.png" },
  { id: "fourth-july-scene", label: "Fourth of July Photo", product: "Design", image: "/occasion-tiles/fourth-july-photo.png" },
  { id: "anniversary-scene", label: "Anniversary Watercolor", product: "Design", image: "/occasion-tiles/anniversary-watercolor.png" },
  { id: "birthday-scene", label: "Birthday Scene", product: "Design", image: "/occasion-tiles/birthday-confetti.png" },
  { id: "pet-scene", label: "Pet Portrait Scene", product: "Design", image: "/occasion-tiles/pet-gifts-portrait.png" },
];

type HeroFloatingCardsProps = {
  layout: HeroLayoutResult;
  cursorOffset: { x: number; y: number };
  cardsY: MotionValue<number>;
  reduceMotion: boolean;
};

export function HeroFloatingCards({ layout, cursorOffset, cardsY, reduceMotion }: HeroFloatingCardsProps) {
  const { positions } = layout;
  if (positions.length === 0) return null;

  const cards = CARD_DEFS.slice(0, positions.length);

  return (
    <motion.div
      aria-hidden
      style={FF.cinematicUX ? { y: cardsY } : undefined}
      className="pointer-events-none absolute inset-0 z-10"
    >
      {cards.map((def, i) => {
        const pos = positions[i];
        if (!pos) return null;
        const cursorMul = 0.24 + i * 0.015;
        const motionAmp = layout.heroHeight < 500 ? 0.5 : 1;
        const animY = reduceMotion ? 0 : (i % 2 === 0 ? -12 : 12) * pos.animationScale * motionAmp;
        const animRot = reduceMotion ? 0 : (i % 2 === 0 ? 1.4 : -1.4) * pos.animationScale * motionAmp;

        return (
          <motion.div
            key={def.id}
            className="absolute"
            style={{
              top: pos.top,
              left: pos.left,
              width: pos.w,
              height: pos.h,
              x: cursorOffset.x * cursorMul,
              y: cursorOffset.y * cursorMul,
            }}
            animate={
              reduceMotion
                ? undefined
                : { y: [0, animY, 0], rotate: [0, animRot, 0] }
            }
            transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }}
          >
            <InteractiveCard
              image={
                <Image
                  src={def.image}
                  alt={def.label}
                  width={240}
                  height={160}
                  className="h-full w-full rounded-xl object-cover"
                />
              }
              title={def.label}
              subtitle={`${def.product} preview`}
              className="border-black/10 bg-white/80"
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
