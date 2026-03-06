"use client";

import React, { useState, useRef, Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useFrame } from "@react-three/fiber";
import {
  Clouds,
  Cloud,
  PerformanceMonitor,
  AdaptiveDpr,
  AdaptiveEvents,
  usePerformanceMonitor,
} from "@react-three/drei";
import * as THREE from "three";
import type { Region } from "@/lib/region";
import { setRegion } from "@/lib/region";

const Canvas = dynamic(
  () => import("@react-three/fiber").then((mod) => mod.Canvas),
  { ssr: false }
);

const IVORY = "#F9F8F6";

type PremiumGatewayProps = {
  onComplete: (region: Region) => void;
};

export function PremiumGateway({ onComplete }: PremiumGatewayProps) {
  const [phase, setPhase] = useState<"idle" | "washing" | "flying">("idle");
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [washOrigin, setWashOrigin] = useState({ x: 0, y: 0 });

  const startTransition = (region: Region, event: React.MouseEvent) => {
    setSelectedRegion(region);
    setWashOrigin({ x: event.clientX, y: event.clientY });
    setPhase("washing");
    setTimeout(() => setPhase("flying"), 500);
    setTimeout(() => {
      setRegion(region);
      onComplete(region);
    }, 2500);
  };

  return (
    <div
      className="fixed inset-0 z-[100] h-screen w-screen overflow-hidden"
      style={{ backgroundColor: IVORY }}
    >
      {/* ACT 1: Regional Selection */}
      {phase === "idle" && (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden px-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(219,232,241,0.48),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(250,223,205,0.46),transparent_30%),linear-gradient(180deg,#faf7f2_0%,#f6f1eb_100%)]" />
          <div className="absolute left-[8%] top-[18%] h-44 w-44 rounded-full bg-[#dbe8f2]/60 blur-3xl" />
          <div className="absolute bottom-[14%] right-[10%] h-52 w-52 rounded-full bg-[#f8ddcb]/60 blur-3xl" />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="relative z-10 w-full max-w-5xl rounded-[2.25rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.76),rgba(248,244,238,0.74))] p-5 shadow-[0_40px_110px_-52px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:p-8"
          >
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/40">Choose experience</p>
              <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.05em] text-[#201d1b] sm:text-5xl">
                Enter the Keepsy studio.
              </h1>
              <p className="mt-4 text-base leading-8 text-black/58">
                Select your region for local shipping, occasion timing, and product availability. Then continue into the studio.
              </p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <RegionSide
                name="UK"
                region="UK"
                onSelect={(e) => startTransition("UK", e)}
              />
              <RegionSide
                name="US"
                region="US"
                onSelect={(e) => startTransition("US", e)}
              />
            </div>
          </motion.div>
        </div>
      )}

      {/* ACT 2: Color Wash - expands from click point */}
      <AnimatePresence>
        {phase === "washing" && selectedRegion && (
          <motion.div
            key="wash"
            className="pointer-events-none fixed inset-0 z-40"
            initial={{ clipPath: `circle(0px at ${washOrigin.x}px ${washOrigin.y}px)` }}
            animate={{ clipPath: `circle(200vmax at ${washOrigin.x}px ${washOrigin.y}px)` }}
            transition={{ duration: 0.7, ease: [0.2, 0.9, 0.2, 1] }}
            style={{
              backgroundColor: selectedRegion === "UK" ? "#012169" : "#3C3B6E",
            }}
          />
        )}
      </AnimatePresence>

      {/* ACT 3: 3D Cloud Flight - immediate transition after wash */}
      <AnimatePresence>
        {phase === "flying" && (
          <motion.div
            key="flying"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50"
            style={{ backgroundColor: IVORY }}
          >
            <ErrorBoundary
              fallback={
                <div
                  className="flex h-full items-center justify-center"
                  style={{ backgroundColor: IVORY }}
                >
                  <span className="font-serif text-obsidian/40">3D unavailable — continuing…</span>
                </div>
              }
            >
              <Suspense
                fallback={
                  <div
                    className="flex h-full items-center justify-center"
                    style={{ backgroundColor: IVORY }}
                  >
                    <span className="font-serif text-obsidian/40">Calibrating studio…</span>
                  </div>
                }
              >
                <Canvas
                camera={{ position: [0, 0, 5], fov: 75 }}
                gl={{ alpha: false }}
                dpr={[1, 2]}
                performance={{ min: 0.5, max: 1 }}
                className="h-full w-full"
              >
                <color attach="background" args={[IVORY]} />
                <PerformanceMonitor>
                  <AdaptiveDpr pixelated />
                  <AdaptiveEvents />
                  <CloudSceneWithPerf isAccelerating />
                </PerformanceMonitor>
              </Canvas>
              </Suspense>
            </ErrorBoundary>
            {/* ACT 4: White Flash - arrival at 2.5s */}
            <motion.div
              className="pointer-events-none absolute inset-0 z-[51]"
              style={{ backgroundColor: IVORY }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 1] }}
              transition={{ duration: 2.5, times: [0, 0.72, 1] }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const CLOUD_SEGMENT_COUNT = 60; // 40 + 20 from the two Cloud components

function CloudSceneWithPerf({ isAccelerating }: { isAccelerating: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);
  const [perfFactor, setPerfFactor] = useState(1);

  usePerformanceMonitor({
    onChange: ({ factor }) => setPerfFactor(factor),
  });

  useFrame((_: unknown, delta: number) => {
    if (!groupRef.current) return;
    const speed = isAccelerating ? delta * 15 : delta * 0.5;
    groupRef.current.position.z += speed;
    if (groupRef.current.position.z > 20) groupRef.current.position.z = 0;
  });

  const cloudRange = Math.max(10, Math.floor(CLOUD_SEGMENT_COUNT * perfFactor));

  return (
    <>
      <ambientLight intensity={1.5} />
      <pointLight position={[10, 10, 10]} />
      <fog attach="fog" args={["#F9F8F6", 0, 15]} />
      <group ref={groupRef}>
        <Clouds
          material={THREE.MeshLambertMaterial}
          range={cloudRange}
          limit={CLOUD_SEGMENT_COUNT}
        >
          <Cloud segments={40} bounds={[10, 2, 2]} volume={10} color="#F9F8F6" opacity={0.8} />
          <Cloud seed={1} scale={2} volume={5} color="#E2E8FF" fade={100} />
        </Clouds>
      </group>
    </>
  );
}

type RegionSideProps = {
  name: string;
  region: Region;
  onSelect: (e: React.MouseEvent) => void;
};

function RegionSide({ name, region, onSelect }: RegionSideProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="relative flex min-h-[22rem] w-full cursor-pointer items-end overflow-hidden rounded-[1.8rem] border border-white/70 text-left shadow-[0_28px_64px_-34px_rgba(0,0,0,0.42)]"
      onClick={onSelect}
      aria-label={`Shop ${name}`}
    >
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(255,255,255,0.98),rgba(255,255,255,0.45)_24%,transparent_54%),linear-gradient(180deg,#f8fbff_0%,#edf2f7_42%,#d9e1ea_100%)]" />
        <WatercolorCity region={region} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(241,246,251,0.06)_36%,rgba(71,91,117,0.18)_100%)]" />
      </div>
      <div className="relative z-10 w-full p-6 sm:p-7">
        <div className="max-w-[14rem] rounded-[1.5rem] border border-white/80 bg-[rgba(255,255,255,0.52)] p-4 backdrop-blur-xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#2e4055]/58">Regional studio</p>
          <h2 className="mt-2 font-serif text-4xl text-[#1b2a3d] tracking-[-0.04em] sm:text-5xl">
          {name}
          </h2>
          <p className="mt-2 text-sm text-[#243548]/72">
            Enter with local gifting context and shipping.
          </p>
        </div>
      </div>
    </motion.button>
  );
}

function WatercolorCity({ region }: { region: Region }) {
  const isUK = region === "UK";
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-x-[-10%] top-[8%] h-32 rounded-full blur-3xl" style={{ background: isUK ? "rgba(198,212,226,0.55)" : "rgba(206,216,229,0.54)" }} />
      <div className="absolute right-[8%] top-[18%] h-28 w-28 rounded-full blur-2xl" style={{ background: isUK ? "rgba(223,205,187,0.34)" : "rgba(213,201,186,0.34)" }} />
      <svg
        viewBox="0 0 600 380"
        className="absolute inset-0 h-full w-full scale-[1.06] opacity-95"
        aria-hidden
      >
        <defs>
          <filter id={`wash-${region}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <filter id={`soft-${region}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
          <linearGradient id={`sky-${region}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={isUK ? "#f7fbff" : "#f8fbfd"} />
            <stop offset="65%" stopColor={isUK ? "#e8eef4" : "#e7edf3"} />
            <stop offset="100%" stopColor={isUK ? "#d4dde7" : "#d3dbe4"} />
          </linearGradient>
        </defs>
        <rect width="600" height="380" fill={`url(#sky-${region})`} />
        <ellipse cx="300" cy="120" rx="210" ry="78" fill={isUK ? "#f5efe8" : "#eef2f6"} opacity="0.7" filter={`url(#wash-${region})`} />
        <ellipse cx="170" cy="165" rx="140" ry="56" fill={isUK ? "#dce7ef" : "#d8e0ea"} opacity="0.72" filter={`url(#wash-${region})`} />
        <ellipse cx="430" cy="190" rx="150" ry="58" fill={isUK ? "#e7ddd1" : "#dfe3ea"} opacity="0.5" filter={`url(#wash-${region})`} />

        {isUK ? (
          <>
            <circle cx="282" cy="185" r="46" fill="none" stroke="#8da1b8" strokeWidth="5" opacity="0.52" filter="url(#soft-UK)" />
            <line x1="282" y1="139" x2="282" y2="232" stroke="#97a9bd" strokeWidth="3" opacity="0.34" />
            <line x1="236" y1="185" x2="328" y2="185" stroke="#97a9bd" strokeWidth="3" opacity="0.28" />
            <rect x="388" y="105" width="26" height="140" rx="5" fill="#8b9db1" opacity="0.48" filter="url(#soft-UK)" />
            <polygon points="401,82 392,106 410,106" fill="#8b9db1" opacity="0.42" />
            <rect x="118" y="82" width="28" height="164" rx="10" fill="#92a5b7" opacity="0.42" filter="url(#soft-UK)" />
            <polygon points="132,46 108,84 156,84" fill="#92a5b7" opacity="0.36" />
            <polygon points="492,106 522,142 508,244 474,244 460,142" fill="#98a9ba" opacity="0.36" filter="url(#soft-UK)" />
            <path d="M70 248 C120 228, 160 236, 194 248 S278 262, 338 250 430 232, 530 248 L530 332 L70 332 Z" fill="#8799ae" opacity="0.34" filter="url(#wash-UK)" />
          </>
        ) : (
          <>
            <rect x="287" y="72" width="34" height="168" rx="7" fill="#8da0b3" opacity="0.5" filter="url(#soft-US)" />
            <polygon points="304,38 296,72 312,72" fill="#8da0b3" opacity="0.44" />
            <path d="M176 110 L198 92 L220 110 L220 236 L176 236 Z" fill="#95a6b7" opacity="0.42" filter="url(#soft-US)" />
            <path d="M424 100 L444 88 L466 100 L466 236 L424 236 Z" fill="#93a4b6" opacity="0.4" filter="url(#soft-US)" />
            <path d="M122 248 C160 202, 222 202, 260 248" fill="none" stroke="#95aabf" strokeWidth="4" opacity="0.42" />
            <path d="M340 248 C378 202, 440 202, 478 248" fill="none" stroke="#95aabf" strokeWidth="4" opacity="0.42" />
            <line x1="122" y1="248" x2="260" y2="248" stroke="#95aabf" strokeWidth="3" opacity="0.3" />
            <line x1="340" y1="248" x2="478" y2="248" stroke="#95aabf" strokeWidth="3" opacity="0.3" />
            <path d="M88 248 C146 234, 196 242, 232 248 S332 258, 392 248 480 234, 530 248 L530 332 L88 332 Z" fill="#8798aa" opacity="0.34" filter="url(#wash-US)" />
          </>
        )}

        <path d="M0 270 C92 246, 154 258, 222 268 S356 280, 438 264 538 250, 600 270 L600 380 L0 380 Z" fill="#bcc8d3" opacity="0.52" filter={`url(#wash-${region})`} />
        <path d="M0 294 C118 278, 206 286, 302 300 S470 316, 600 298 L600 380 L0 380 Z" fill="#d9e1e8" opacity="0.78" />
      </svg>
    </div>
  );
}
