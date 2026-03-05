"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type InkParticle = {
  id: number;
  x: number;
  y: number;
  rotation: number;
  createdAt: number;
};

const PARTICLE_LIMIT = 20;
const SHAKE_THRESHOLD = 100;
const PARTICLE_LIFETIME_MS = 1200;

function InkSplat({ x, y, rotation }: { x: number; y: number; rotation: number }) {
  return (
    <motion.div
      className="pointer-events-none absolute z-10"
      style={{
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      }}
      initial={{ opacity: 0.9, scale: 0.3 }}
      animate={{ opacity: 0, scale: 1.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      exit={{ opacity: 0 }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#1A1A1A]">
        <ellipse cx="12" cy="12" rx="8" ry="6" fill="currentColor" opacity="0.8" />
        <ellipse cx="8" cy="14" rx="4" ry="3" fill="currentColor" opacity="0.6" />
        <ellipse cx="16" cy="10" rx="3" ry="2" fill="currentColor" opacity="0.5" />
      </svg>
    </motion.div>
  );
}

type MugInspectorProps = {
  children: React.ReactNode;
};

export function MugInspector({ children }: MugInspectorProps) {
  const [particles, setParticles] = useState<InkParticle[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const lastMoveRef = React.useRef({ x: 0, y: 0, t: 0 });
  const nextIdRef = React.useRef(0);

  const pruneExpired = useCallback(() => {
    const now = Date.now();
    setParticles((prev) => prev.filter((p) => now - p.createdAt < PARTICLE_LIFETIME_MS));
  }, []);

  useEffect(() => {
    const interval = setInterval(pruneExpired, 200);
    return () => clearInterval(interval);
  }, [pruneExpired]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const { clientX, clientY } = e;
      const now = Date.now();
      const { x: lx, y: ly, t: lt } = lastMoveRef.current;

      const dt = now - lt;
      if (dt < 16) return;

      const speed = Math.abs(clientX - lx) + Math.abs(clientY - ly);
      if (speed > SHAKE_THRESHOLD) {
        const rect = containerRef.current?.getBoundingClientRect();
        const px = rect ? clientX - rect.left : clientX;
        const py = rect ? clientY - rect.top : clientY;

        const newParticle: InkParticle = {
          id: nextIdRef.current++,
          x: px,
          y: py,
          rotation: Math.random() * 360,
          createdAt: now,
        };

        setParticles((prev) => [...prev.slice(-(PARTICLE_LIMIT - 1)), newParticle]);
      }

      lastMoveRef.current = { x: clientX, y: clientY, t: now };
    },
    []
  );

  return (
    <div ref={containerRef} className="relative" onMouseMove={handleMouseMove}>
      {children}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <AnimatePresence>
          {particles.map((p) => (
            <InkSplat key={p.id} x={p.x} y={p.y} rotation={p.rotation} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
