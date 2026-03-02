"use client";

import { motion } from "framer-motion";
import Image from "next/image";

type FloatingBlob = {
  className: string;
  duration: number;
  delay?: number;
  x: [number, number, number];
  y: [number, number, number];
  scale: [number, number, number];
};

const BLOBS: FloatingBlob[] = [
  {
    className: "absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-[#9FC7E7]/28 blur-[110px]",
    duration: 42,
    x: [0, 70, -40],
    y: [0, 40, -20],
    scale: [1, 1.18, 0.95],
  },
  {
    className: "absolute -right-20 top-[10%] h-[24rem] w-[24rem] rounded-full bg-[#F1C8D7]/26 blur-[110px]",
    duration: 38,
    delay: 2,
    x: [0, -55, 25],
    y: [0, 70, -20],
    scale: [1, 1.12, 0.92],
  },
  {
    className: "absolute left-[8%] bottom-[-16%] h-[30rem] w-[30rem] rounded-full bg-[#EBD8B7]/20 blur-[120px]",
    duration: 48,
    delay: 4,
    x: [0, 50, -30],
    y: [0, -45, 30],
    scale: [1, 1.1, 0.9],
  },
];

const FLOATING_CARDS = [
  { src: "/product-tiles/tee-white.png", className: "hidden xl:block left-[5%] top-[16%] w-28" },
  { src: "/product-tiles/plain-mug-front.png", className: "hidden xl:block right-[7%] top-[20%] w-28" },
  { src: "/occasion-tiles/christmas-scene.png", className: "hidden 2xl:block right-[16%] bottom-[18%] w-24" },
  { src: "/occasion-tiles/anniversary-watercolor.png", className: "hidden 2xl:block left-[14%] bottom-[16%] w-24" },
];

export default function MagicpathBackground({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {BLOBS.map((blob) => (
        <motion.div
          key={blob.className}
          className={blob.className}
          animate={{ x: blob.x, y: blob.y, scale: blob.scale, rotate: [0, 90, 180] }}
          transition={{ duration: blob.duration, repeat: Infinity, ease: "linear", delay: blob.delay ?? 0 }}
        />
      ))}

      {FLOATING_CARDS.map((card, idx) => (
        <motion.div
          key={card.src}
          className={`absolute rounded-2xl border border-white/50 bg-white/45 p-2 shadow-2xl backdrop-blur-xl ${card.className}`}
          animate={{ y: [0, idx % 2 === 0 ? -10 : 10, 0], rotate: [0, idx % 2 === 0 ? 1.5 : -1.5, 0] }}
          transition={{ duration: 7 + idx, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image src={card.src} alt="" width={180} height={120} className="h-24 w-full rounded-xl object-cover opacity-85" />
        </motion.div>
      ))}
    </div>
  );
}

