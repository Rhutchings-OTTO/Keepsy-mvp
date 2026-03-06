"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring } from "framer-motion";

type TextureLoupeProps = {
  /** URL of the AI-generated design image */
  aiImage: string;
  /** Base product image (fabric, folds) */
  productBase: string;
  /** Top overlay image (drawstrings, highlights) */
  productTop: string;
  /** Loupe diameter in pixels. Default 192 */
  loupeSize?: number;
  /** Zoom scale for the loupe. Default 3 */
  zoomScale?: number;
  className?: string;
};

export function TextureLoupe({
  aiImage,
  productBase,
  productTop,
  loupeSize = 192,
  zoomScale = 3,
  className = "",
}: TextureLoupeProps) {
  const [showLoupe, setShowLoupe] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 300, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 300, damping: 30 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      if (!el) return;
      const { left, top, width, height } = el.getBoundingClientRect();
      const x = ((e.clientX - left) / width) * 100;
      const y = ((e.clientY - top) / height) * 100;
      mouseX.set(e.clientX - left);
      mouseY.set(e.clientY - top);
      el.style.setProperty("--zoom-x", `${x}%`);
      el.style.setProperty("--zoom-y", `${y}%`);
    },
    [mouseX, mouseY]
  );

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setShowLoupe(true)}
      onMouseLeave={() => setShowLoupe(false)}
      onMouseMove={handleMouseMove}
      className={`group relative aspect-square w-full max-w-2xl cursor-none bg-ivory ${className}`}
    >
      {/* 1. Standard View (The Sandwich) */}
      <div className="absolute inset-0 z-10">
        <Image src={productBase} alt="" fill className="object-contain" sizes="(max-width: 1024px) 100vw, 700px" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-[35%] aspect-square">
            <Image
              src={aiImage}
              alt="Your design"
              fill
              className="object-contain opacity-90 mix-blend-multiply"
              unoptimized={aiImage.startsWith("data:")}
              sizes="280px"
            />
          </div>
        </div>
        <Image src={productTop} alt="" fill className="object-contain z-20" sizes="(max-width: 1024px) 100vw, 700px" />
      </div>

      {/* 2. The Loupe (The Zoomed Lens) */}
      {showLoupe && (
        <motion.div
          style={{
            x: springX,
            y: springY,
            translateX: "-50%",
            translateY: "-50%",
            width: loupeSize,
            height: loupeSize,
          }}
          className="pointer-events-none absolute z-50 overflow-hidden rounded-full border-2 border-white shadow-2xl"
        >
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: `${zoomScale * 100}%`,
              height: `${zoomScale * 100}%`,
              backgroundImage: `url(${productBase})`,
              backgroundPosition: "var(--zoom-x) var(--zoom-y)",
              backgroundSize: "cover",
            }}
          />
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-95 mix-blend-multiply"
            style={{
              width: `${zoomScale * 100}%`,
              height: `${zoomScale * 100}%`,
              backgroundImage: `url(${aiImage})`,
              backgroundPosition: "var(--zoom-x) var(--zoom-y)",
              backgroundSize: "35%",
              backgroundRepeat: "no-repeat",
            }}
          />
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: `${zoomScale * 100}%`,
              height: `${zoomScale * 100}%`,
              backgroundImage: `url(${productTop})`,
              backgroundPosition: "var(--zoom-x) var(--zoom-y)",
              backgroundSize: "cover",
            }}
          />
        </motion.div>
      )}
    </div>
  );
}
