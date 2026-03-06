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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.88),rgba(255,255,255,0.08)_28%,transparent_54%),linear-gradient(180deg,#d6dde6_0%,#8998a8_36%,#2a3341_100%)]" />
        <div className="absolute inset-0">
          <ErrorBoundary fallback={<div className="absolute inset-0 bg-[linear-gradient(180deg,#dbe2ea_0%,#39485b_100%)]" />}>
            <Suspense fallback={<div className="absolute inset-0 bg-[linear-gradient(180deg,#dbe2ea_0%,#39485b_100%)]" />}>
              <Canvas
                camera={{ position: [0, 7.5, 14], fov: 42 }}
                gl={{ alpha: true, antialias: true }}
                dpr={[1, 1.75]}
                className="h-full w-full"
              >
                <TonalCityScene region={region} />
              </Canvas>
            </Suspense>
          </ErrorBoundary>
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,16,22,0.02),rgba(10,14,20,0.34)_58%,rgba(10,14,20,0.72)_100%)]" />
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

type CityBlock = {
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
};

function TonalCityScene({ region }: { region: Region }) {
  const rootRef = useRef<THREE.Group>(null!);
  const blocks = React.useMemo<CityBlock[]>(
    () => (region === "UK" ? buildLondonBlocks() : buildNewYorkBlocks()),
    [region]
  );

  useFrame(({ clock, pointer }) => {
    if (!rootRef.current) return;
    const t = clock.getElapsedTime();
    rootRef.current.rotation.y = pointer.x * 0.18 + Math.sin(t * 0.18) * 0.04;
    rootRef.current.rotation.x = -0.08 + pointer.y * 0.08;
    rootRef.current.position.y = Math.sin(t * 0.35) * 0.08;
  });

  return (
    <>
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#9aa7b5", 10, 28]} />
      <ambientLight intensity={1.35} />
      <hemisphereLight intensity={1} groundColor="#243140" color="#f7fbff" />
      <directionalLight position={[8, 12, 6]} intensity={1.75} color="#ffffff" />
      <directionalLight position={[-6, 5, -8]} intensity={0.8} color="#9fc4ff" />
      <group ref={rootRef} position={[0, -1.45, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[10, 64]} />
          <meshStandardMaterial color="#2b3642" metalness={0.62} roughness={0.34} />
        </mesh>
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[5.8, 8.8, 64]} />
          <meshBasicMaterial color="#dbe9ff" transparent opacity={0.16} />
        </mesh>
        <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[4.6, 48]} />
          <meshBasicMaterial color="#9bc4ff" transparent opacity={0.08} />
        </mesh>
        {blocks.map((block, index) => (
          <mesh
            key={`${region}-${index}`}
            position={block.position}
            scale={block.scale}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={block.color} metalness={0.76} roughness={0.26} />
          </mesh>
        ))}
        {region === "UK" ? <LondonLandmarks /> : <NewYorkLandmarks />}
      </group>
    </>
  );
}

function LondonLandmarks() {
  return (
    <>
      <mesh position={[-2.2, 2.8, -0.2]} castShadow receiveShadow>
        <coneGeometry args={[0.78, 5.5, 18, 10, true]} />
        <meshStandardMaterial color="#dfe7f0" metalness={0.82} roughness={0.24} />
      </mesh>
      <mesh position={[1.8, 3.6, 0.1]} castShadow receiveShadow>
        <boxGeometry args={[0.88, 7.2, 0.88]} />
        <meshStandardMaterial color="#eef5ff" metalness={0.75} roughness={0.22} />
      </mesh>
      <mesh position={[1.8, 7.5, 0.1]} castShadow>
        <coneGeometry args={[0.24, 1.3, 12]} />
        <meshStandardMaterial color="#f7fbff" metalness={0.9} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0.18, 0]}>
        <torusGeometry args={[6, 0.08, 12, 64]} />
        <meshBasicMaterial color="#bed7ff" transparent opacity={0.16} />
      </mesh>
    </>
  );
}

function NewYorkLandmarks() {
  return (
    <>
      <mesh position={[0.2, 4.2, -0.3]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 8.4, 1.1]} />
        <meshStandardMaterial color="#eff6ff" metalness={0.78} roughness={0.2} />
      </mesh>
      <mesh position={[0.2, 8.9, -0.3]} castShadow>
        <coneGeometry args={[0.18, 1.2, 10]} />
        <meshStandardMaterial color="#ffffff" metalness={0.94} roughness={0.14} />
      </mesh>
      <mesh position={[-2.5, 2.8, 0.8]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 5.6, 1.4]} />
        <meshStandardMaterial color="#d9e3f1" metalness={0.72} roughness={0.28} />
      </mesh>
      <mesh position={[2.8, 3.1, 0.4]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 6.2, 1.2]} />
        <meshStandardMaterial color="#d0dceb" metalness={0.72} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, -0.12, 0]}>
        <torusGeometry args={[6.2, 0.07, 12, 64]} />
        <meshBasicMaterial color="#dbe7ff" transparent opacity={0.14} />
      </mesh>
    </>
  );
}

function buildLondonBlocks(): CityBlock[] {
  return [
    [-4.8, 1.3, 0.9, 0.6, 2.6, 0.6, "#a4b4c5"],
    [-3.7, 1.9, -1.4, 0.8, 3.8, 0.8, "#b7c5d3"],
    [-2.8, 1.1, 1.7, 0.7, 2.2, 0.7, "#95a6b8"],
    [-1.2, 1.6, -1.9, 0.75, 3.2, 0.75, "#c6d3df"],
    [0, 1.1, 2.2, 0.72, 2.2, 0.72, "#aab9c9"],
    [1.1, 1.8, -1.5, 0.82, 3.6, 0.82, "#d3dee8"],
    [2.9, 1.2, 1.5, 0.7, 2.4, 0.7, "#a0b2c4"],
    [4.2, 1.7, -0.9, 0.85, 3.4, 0.85, "#b9c8d8"],
    [-4.1, 0.8, -3.4, 0.55, 1.6, 0.55, "#8fa0b1"],
    [-2.1, 1.05, -3.1, 0.62, 2.1, 0.62, "#9caec0"],
    [0.6, 0.9, -3.4, 0.58, 1.8, 0.58, "#8d9eb0"],
    [3.4, 0.95, -3.2, 0.64, 1.9, 0.64, "#9eaec0"],
  ].map(([x, y, z, sx, sy, sz, color]) => ({
    position: [x as number, y as number, z as number],
    scale: [sx as number, sy as number, sz as number],
    color: color as string,
  }));
}

function buildNewYorkBlocks(): CityBlock[] {
  return [
    [-5.2, 1.4, 0.8, 0.72, 2.8, 0.72, "#9cacbe"],
    [-4.1, 2.2, -1.2, 0.95, 4.4, 0.95, "#bac7d6"],
    [-3, 1.5, 1.7, 0.8, 3, 0.8, "#a7b8ca"],
    [-1.6, 2.6, -1.9, 0.86, 5.2, 0.86, "#d1dbe6"],
    [1.5, 2.1, 1.6, 0.9, 4.2, 0.9, "#b1c0d1"],
    [3.3, 2.5, -1.4, 0.94, 5, 0.94, "#d7e2ed"],
    [4.8, 1.6, 1.1, 0.78, 3.2, 0.78, "#a2b3c5"],
    [-4.6, 1.1, -3.3, 0.62, 2.2, 0.62, "#92a5b8"],
    [-2.4, 1.25, -3.2, 0.66, 2.5, 0.66, "#9cafc1"],
    [0.2, 1.2, -3.4, 0.64, 2.4, 0.64, "#95a7b9"],
    [2.3, 1.3, -3.1, 0.68, 2.6, 0.68, "#9eb1c4"],
    [4.4, 1.15, -3.3, 0.6, 2.3, 0.6, "#8fa1b4"],
  ].map(([x, y, z, sx, sy, sz, color]) => ({
    position: [x as number, y as number, z as number],
    scale: [sx as number, sy as number, sz as number],
    color: color as string,
  }));
}
