"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useEasterEggMouse } from "@/context/EasterEggContext";

const RING_SIZE = 28;
const RING_STROKE = 1.5;

export function RingCursor() {
  const mouse = useEasterEggMouse();
  const [isTouch, setIsTouch] = useState(true);

  useEffect(() => {
    setIsTouch(!window.matchMedia("(pointer: fine)").matches);
  }, []);

  useEffect(() => {
    if (!mouse?.visible) return;
    document.body.style.cursor = "none";
    return () => {
      document.body.style.cursor = "";
    };
  }, [mouse?.visible]);

  if (isTouch || !mouse || !mouse.visible) return null;

  const size = mouse.hoverTarget?.size ?? RING_SIZE;
  const x = mouse.hoverTarget ? mouse.hoverTarget.x - size / 2 : mouse.x - size / 2;
  const y = mouse.hoverTarget ? mouse.hoverTarget.y - size / 2 : mouse.y - size / 2;

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[9999]"
      style={{ willChange: "transform" }}
      initial={false}
      animate={{
        x,
        y,
        width: size,
        height: size,
      }}
      transition={{
        type: "spring",
        stiffness: mouse.hoverTarget ? 280 : 400,
        damping: 28,
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none">
        <circle
          cx="50"
          cy="50"
          r="47"
          stroke="#1A1A1A"
          strokeWidth={RING_STROKE}
          fill="none"
          opacity={mouse.hoverTarget ? 0.5 : 0.35}
        />
      </svg>
    </motion.div>
  );
}
