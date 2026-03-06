"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { MockupStage } from "./MockupStage";
import type { MockupStageProps } from "./MockupStage";

const LOUPE_SIZE = 192;
const ZOOM_SCALE = 3;

type MockupWithLoupeProps = MockupStageProps & {
  enableLoupe?: boolean;
};

export function MockupWithLoupe({
  enableLoupe = true,
  generatedImage,
  hasArtwork,
  ...mockupProps
}: MockupWithLoupeProps) {
  const [showLoupe, setShowLoupe] = useState(false);
  const [canUseLoupe, setCanUseLoupe] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState({ width: 0, height: 0 });
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 320, damping: 32 });
  const springY = useSpring(mouseY, { stiffness: 320, damping: 32 });
  const loupeX = useTransform(springX, (value) => value - LOUPE_SIZE / 2);
  const loupeY = useTransform(springY, (value) => value - LOUPE_SIZE / 2);
  const panX = useMotionValue(0);
  const panY = useMotionValue(0);
  const springPanX = useSpring(panX, { stiffness: 400, damping: 35 });
  const springPanY = useSpring(panY, { stiffness: 400, damping: 35 });

  const artworkPresent = hasArtwork ?? Boolean(generatedImage);
  const loupeActive = enableLoupe && canUseLoupe && artworkPresent && generatedImage;

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setCanUseLoupe(media.matches);
    sync();
    media.addEventListener?.("change", sync);
    return () => media.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const obs = new ResizeObserver((entries) => {
      const e = entries[0];
      if (e) setRect({ width: e.contentRect.width, height: e.contentRect.height });
    });
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      mouseX.set(x);
      mouseY.set(y);
      panX.set(LOUPE_SIZE / 2 - x * ZOOM_SCALE);
      panY.set(LOUPE_SIZE / 2 - y * ZOOM_SCALE);
    },
    [mouseX, mouseY, panX, panY]
  );

  return (
    <div className="relative">
      <div
        ref={containerRef}
        onMouseEnter={() => loupeActive && setShowLoupe(true)}
        onMouseLeave={() => setShowLoupe(false)}
        onMouseMove={loupeActive ? handleMouseMove : undefined}
        className=""
      >
        <MockupStage
          {...mockupProps}
          generatedImage={generatedImage}
          hasArtwork={hasArtwork}
        />

        {showLoupe && loupeActive && rect.width > 0 && (
          <motion.div
            style={{
              left: 0,
              top: 0,
              x: loupeX,
              y: loupeY,
              width: LOUPE_SIZE,
              height: LOUPE_SIZE,
            }}
            className="pointer-events-none absolute z-50 overflow-hidden rounded-full border-2 border-white/90 shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
          >
            <motion.div
              className="absolute"
              style={{
                width: rect.width * ZOOM_SCALE,
                height: rect.height * ZOOM_SCALE,
                left: springPanX,
                top: springPanY,
              }}
            >
              <div
                style={{
                  width: rect.width,
                  height: rect.height,
                  transform: `scale(${ZOOM_SCALE})`,
                  transformOrigin: "0 0",
                }}
              >
                <MockupStage
                  {...mockupProps}
                  generatedImage={generatedImage}
                  hasArtwork={hasArtwork}
                  className="!rounded-[22px]"
                />
              </div>
            </motion.div>

            {/* Glass reflection overlay */}
            <div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 45%, rgba(255,255,255,0.08) 100%)",
                mixBlendMode: "overlay",
              }}
              aria-hidden
            />
          </motion.div>
        )}
      </div>

      {loupeActive && (
        <p className="mt-3 text-center text-xs font-medium tracking-wide text-black/45">
          Hover to inspect material detail
        </p>
      )}
    </div>
  );
}
