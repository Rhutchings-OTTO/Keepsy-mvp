"use client";

import React, { useState, useRef, Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
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

const UK_IMAGE = "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1920&q=80";
const US_IMAGE = "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=1920&q=80";

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
                image={UK_IMAGE}
                onSelect={(e) => startTransition("UK", e)}
              />
              <RegionSide
                name="US"
                image={US_IMAGE}
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
  image: string;
  onSelect: (e: React.MouseEvent) => void;
};

function RegionSide({ name, image, onSelect }: RegionSideProps) {
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
        <Image src={image} alt={name} fill className="object-cover" sizes="50vw" priority />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,18,21,0.12),rgba(16,18,21,0.52))]" />
      </div>
      <div className="relative z-10 w-full p-6 sm:p-7">
        <div className="max-w-[14rem] rounded-[1.5rem] border border-white/25 bg-[rgba(255,255,255,0.14)] p-4 backdrop-blur-md">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">Regional studio</p>
          <h2 className="mt-2 font-serif text-4xl text-white tracking-[-0.04em] drop-shadow-lg sm:text-5xl">
          {name}
          </h2>
          <p className="mt-2 text-sm text-white/78">
            Enter with local gifting context and shipping.
          </p>
        </div>
      </div>
    </motion.button>
  );
}
