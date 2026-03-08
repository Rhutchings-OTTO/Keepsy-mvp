"use client";

import { motion } from "framer-motion";

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

    </div>
  );
}

