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
  Edges,
} from "@react-three/drei";
import { easing } from "maath";
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(255,255,255,0.98),rgba(255,255,255,0.45)_24%,transparent_54%),linear-gradient(180deg,#f8fbff_0%,#eaf0f8_42%,#d8e3ef_100%)]" />
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
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(241,246,251,0.1)_36%,rgba(71,91,117,0.26)_100%)]" />
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

type CityBlock = {
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
  glow?: string;
};

type HoloPrimitiveProps = React.ComponentProps<"mesh"> & {
  color?: string;
  wireColor?: string;
  opacity?: number;
  children: React.ReactNode;
};

function HoloPrimitive({
  color = "#eaf6ff",
  wireColor = "#9fd7ff",
  opacity = 0.4,
  children,
  ...props
}: HoloPrimitiveProps) {
  return (
    <mesh castShadow receiveShadow {...props}>
      {children}
      <meshPhysicalMaterial
        color={color}
        metalness={0.18}
        roughness={0.12}
        transparent
        opacity={opacity}
        transmission={0.2}
        thickness={1.1}
        clearcoat={1}
        clearcoatRoughness={0.08}
      />
      <Edges color={wireColor} threshold={12} />
    </mesh>
  );
}

function TonalCityScene({ region }: { region: Region }) {
  const rootRef = useRef<THREE.Group>(null!);
  const blocks = React.useMemo<CityBlock[]>(
    () => (region === "UK" ? buildLondonBlocks() : buildNewYorkBlocks()),
    [region]
  );

  useFrame(({ clock, pointer }) => {
    if (!rootRef.current) return;
    const t = clock.getElapsedTime();
    easing.dampE(rootRef.current.rotation, [-0.16 + pointer.y * 0.06, pointer.x * 0.24 + Math.sin(t * 0.18) * 0.05, 0], 0.18, 0.016);
    rootRef.current.position.y = Math.sin(t * 0.42) * 0.08;
  });

  return (
    <>
      <fog attach="fog" args={["#edf4fb", 12, 30]} />
      <ambientLight intensity={1.7} />
      <hemisphereLight intensity={1.3} groundColor="#b8cbdf" color="#ffffff" />
      <directionalLight position={[10, 12, 6]} intensity={1.45} color="#ffffff" />
      <directionalLight position={[-8, 6, -8]} intensity={0.9} color="#8fcbff" />
      <pointLight position={[0, 9, 3]} intensity={1.2} color="#d5ebff" />
      <group ref={rootRef} position={[0, -1.45, 0]} scale={1.04}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[10, 96]} />
          <meshPhysicalMaterial color="#eef5fb" metalness={0.18} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />
        </mesh>
        <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[5.5, 8.9, 80]} />
          <meshBasicMaterial color="#9ac7ff" transparent opacity={0.22} />
        </mesh>
        <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.8, 4.6, 64]} />
          <meshBasicMaterial color="#c2e2ff" transparent opacity={0.26} />
        </mesh>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[16, 16, 22, 22]} />
          <meshBasicMaterial color="#d8e8f6" wireframe transparent opacity={0.12} />
        </mesh>
        {blocks.map((block, index) => (
          <HologramTower key={`${region}-${index}`} block={block} />
        ))}
        {region === "UK" ? <LondonLandmarks /> : <NewYorkLandmarks />}
        <HologramOrbs />
      </group>
    </>
  );
}

function HologramTower({ block }: { block: CityBlock }) {
  const wireColor = block.glow ?? "#93cfff";
  return (
    <group position={block.position} scale={block.scale}>
      <HoloPrimitive color={block.color} wireColor={wireColor} opacity={0.42}>
        <boxGeometry args={[1, 1, 1]} />
      </HoloPrimitive>
      <mesh position={[0, 0.51, 0]} scale={[0.72, 0.02, 0.72]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#e2f4ff" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function LondonLandmarks() {
  return (
    <>
      <group position={[-2.9, 0, -0.2]}>
        <HoloPrimitive position={[0, 2.55, 0]} color="#dceffc" wireColor="#8ecbff" opacity={0.34}>
          <cylinderGeometry args={[0.34, 0.72, 5.3, 18, 1, true]} />
        </HoloPrimitive>
        <mesh position={[0, 5.45, 0]} castShadow>
          <sphereGeometry args={[0.22, 18, 18]} />
          <meshBasicMaterial color="#cceeff" transparent opacity={0.7} />
        </mesh>
      </group>
      <group position={[2.35, 0, -0.15]}>
        <HoloPrimitive position={[0, 3.25, 0]} color="#edf8ff" wireColor="#97cdff" opacity={0.42}>
          <boxGeometry args={[0.9, 6.5, 0.9]} />
        </HoloPrimitive>
        <mesh position={[0, 6.95, 0]} castShadow>
          <coneGeometry args={[0.18, 1.1, 12]} />
          <meshBasicMaterial color="#a9ddff" transparent opacity={0.7} />
        </mesh>
        <mesh position={[0, 4.8, 0.47]}>
          <boxGeometry args={[0.56, 0.26, 0.08]} />
          <meshBasicMaterial color="#dff4ff" transparent opacity={0.58} />
        </mesh>
        <mesh position={[0, 3.95, 0.47]}>
          <boxGeometry args={[0.56, 0.16, 0.08]} />
          <meshBasicMaterial color="#dff4ff" transparent opacity={0.44} />
        </mesh>
      </group>
      <group position={[0.25, 2.1, 1.85]} rotation={[Math.PI / 2, 0.18, 0.36]}>
        <mesh>
          <torusGeometry args={[1.65, 0.08, 12, 72]} />
          <meshBasicMaterial color="#9fd5ff" transparent opacity={0.42} />
        </mesh>
        <lineSegments scale={[1.01, 1.01, 1.01]}>
          <edgesGeometry args={[new THREE.TorusGeometry(1.65, 0.08, 12, 72)]} />
          <lineBasicMaterial color="#e1f4ff" transparent opacity={0.32} />
        </lineSegments>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.65, 0.02, 6, 36]} />
          <meshBasicMaterial color="#ddf3ff" transparent opacity={0.55} />
        </mesh>
      </group>
      <group position={[3.85, 0.78, 1.4]}>
        <HoloPrimitive rotation={[0, 0, Math.PI / 4]} color="#e4f4ff" wireColor="#a7dbff" opacity={0.34}>
          <cylinderGeometry args={[0.62, 0.62, 2.1, 6]} />
        </HoloPrimitive>
      </group>
    </>
  );
}

function NewYorkLandmarks() {
  return (
    <>
      <group position={[0.3, 0, -0.2]}>
        <HoloPrimitive position={[0, 4.1, 0]} color="#eef8ff" wireColor="#8ecfff" opacity={0.42}>
          <boxGeometry args={[1.02, 8.2, 1.02]} />
        </HoloPrimitive>
        <mesh position={[0, 8.8, 0]} castShadow>
          <coneGeometry args={[0.14, 1.2, 12]} />
          <meshBasicMaterial color="#9fd7ff" transparent opacity={0.82} />
        </mesh>
      </group>
      <group position={[-2.75, 0, 0.78]}>
        <HoloPrimitive position={[0, 2.75, 0]} color="#dcefff" wireColor="#99d7ff" opacity={0.34}>
          <cylinderGeometry args={[0.82, 1.02, 5.5, 8]} />
        </HoloPrimitive>
        <mesh position={[0, 5.9, 0]} castShadow>
          <coneGeometry args={[0.42, 1.05, 8]} />
          <meshBasicMaterial color="#bee7ff" transparent opacity={0.62} />
        </mesh>
      </group>
      <group position={[3.05, 0, 0.35]}>
        <HoloPrimitive position={[0, 3.05, 0]} color="#deefff" wireColor="#a3d9ff" opacity={0.3}>
          <cylinderGeometry args={[0.72, 0.9, 6.1, 24]} />
        </HoloPrimitive>
        <mesh position={[0, 6.35, 0]} castShadow>
          <coneGeometry args={[0.3, 0.95, 16]} />
          <meshBasicMaterial color="#c4e9ff" transparent opacity={0.56} />
        </mesh>
      </group>
      <group position={[-0.25, 0.62, 2.5]}>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[5.8, 0.08, 0.08]} />
          <meshBasicMaterial color="#d9f3ff" transparent opacity={0.5} />
        </mesh>
        <HoloPrimitive position={[-2.5, 1.15, 0]} color="#eaf8ff" wireColor="#b7e5ff" opacity={0.36}>
          <boxGeometry args={[0.18, 2.1, 0.18]} />
        </HoloPrimitive>
        <HoloPrimitive position={[2.5, 1.15, 0]} color="#eaf8ff" wireColor="#b7e5ff" opacity={0.36}>
          <boxGeometry args={[0.18, 2.1, 0.18]} />
        </HoloPrimitive>
        <mesh position={[-1.25, 0.82, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 2.55, 8]} />
          <meshBasicMaterial color="#9ad7ff" transparent opacity={0.48} />
        </mesh>
        <mesh position={[1.25, 0.82, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 2.55, 8]} />
          <meshBasicMaterial color="#9ad7ff" transparent opacity={0.48} />
        </mesh>
      </group>
    </>
  );
}

function HologramOrbs() {
  return (
    <>
      <mesh position={[-5.8, 4.2, 1.5]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshBasicMaterial color="#9ad8ff" transparent opacity={0.72} />
      </mesh>
      <mesh position={[5.4, 5.3, -1.4]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshBasicMaterial color="#b7e8ff" transparent opacity={0.68} />
      </mesh>
      <mesh position={[0.6, 6.4, 2.1]}>
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshBasicMaterial color="#dbf6ff" transparent opacity={0.78} />
      </mesh>
    </>
  );
}

function buildLondonBlocks(): CityBlock[] {
  return [
    [-4.8, 1.3, 0.9, 0.6, 2.6, 0.6, "#cddceb", "#9fd6ff"],
    [-3.7, 1.9, -1.4, 0.8, 3.8, 0.8, "#dce7f1", "#a7dbff"],
    [-2.8, 1.1, 1.7, 0.7, 2.2, 0.7, "#c6d7e6", "#8eceff"],
    [-1.2, 1.6, -1.9, 0.75, 3.2, 0.75, "#e2ebf3", "#b4e1ff"],
    [0, 1.1, 2.2, 0.72, 2.2, 0.72, "#d4e1ed", "#a8dbff"],
    [1.1, 1.8, -1.5, 0.82, 3.6, 0.82, "#e8eff6", "#c2e8ff"],
    [2.9, 1.2, 1.5, 0.7, 2.4, 0.7, "#c8d9e7", "#9ed2ff"],
    [4.2, 1.7, -0.9, 0.85, 3.4, 0.85, "#d8e4ef", "#b4e0ff"],
    [-4.1, 0.8, -3.4, 0.55, 1.6, 0.55, "#c3d3e1", "#8fc8ff"],
    [-2.1, 1.05, -3.1, 0.62, 2.1, 0.62, "#cddcea", "#9fd1ff"],
    [0.6, 0.9, -3.4, 0.58, 1.8, 0.58, "#c0d1df", "#90c7ff"],
    [3.4, 0.95, -3.2, 0.64, 1.9, 0.64, "#c9d8e6", "#a2d6ff"],
  ].map(([x, y, z, sx, sy, sz, color, glow]) => ({
    position: [x as number, y as number, z as number],
    scale: [sx as number, sy as number, sz as number],
    color: color as string,
    glow: glow as string,
  }));
}

function buildNewYorkBlocks(): CityBlock[] {
  return [
    [-5.2, 1.4, 0.8, 0.72, 2.8, 0.72, "#ccdbea", "#a6dcff"],
    [-4.1, 2.2, -1.2, 0.95, 4.4, 0.95, "#dbe6f1", "#b4e2ff"],
    [-3, 1.5, 1.7, 0.8, 3, 0.8, "#cfdeeb", "#9ad3ff"],
    [-1.6, 2.6, -1.9, 0.86, 5.2, 0.86, "#e4edf5", "#c2e8ff"],
    [1.5, 2.1, 1.6, 0.9, 4.2, 0.9, "#d4e1ed", "#a8dcff"],
    [3.3, 2.5, -1.4, 0.94, 5, 0.94, "#e6eef5", "#c9ecff"],
    [4.8, 1.6, 1.1, 0.78, 3.2, 0.78, "#c9dae7", "#9fd3ff"],
    [-4.6, 1.1, -3.3, 0.62, 2.2, 0.62, "#c0d2e2", "#8ecaff"],
    [-2.4, 1.25, -3.2, 0.66, 2.5, 0.66, "#cad9e8", "#9fd4ff"],
    [0.2, 1.2, -3.4, 0.64, 2.4, 0.64, "#c3d5e4", "#97ceff"],
    [2.3, 1.3, -3.1, 0.68, 2.6, 0.68, "#cbdae9", "#a8daff"],
    [4.4, 1.15, -3.3, 0.6, 2.3, 0.6, "#bed0e0", "#91cbff"],
  ].map(([x, y, z, sx, sy, sz, color, glow]) => ({
    position: [x as number, y as number, z as number],
    scale: [sx as number, sy as number, sz as number],
    color: color as string,
    glow: glow as string,
  }));
}
