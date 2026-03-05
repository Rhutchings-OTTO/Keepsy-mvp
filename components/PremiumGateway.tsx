"use client";

import React, { useState, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useFrame } from "@react-three/fiber";
import { Clouds, Cloud } from "@react-three/drei";
import * as THREE from "three";
import type { Region } from "@/lib/region";
import { setRegion } from "@/lib/region";
import { playSonicTransition } from "@/lib/sonicTransition";

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
    playSonicTransition();
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
        <div className="flex h-full w-full">
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
                className="h-full w-full"
              >
                <color attach="background" args={[IVORY]} />
                <CloudScene isAccelerating />
              </Canvas>
            </Suspense>
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

function CloudScene({ isAccelerating }: { isAccelerating: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((_: unknown, delta: number) => {
    if (!groupRef.current) return;
    const speed = isAccelerating ? delta * 15 : delta * 0.5;
    groupRef.current.position.z += speed;
    if (groupRef.current.position.z > 20) groupRef.current.position.z = 0;
  });

  return (
    <>
      <ambientLight intensity={1.5} />
      <pointLight position={[10, 10, 10]} />
      <fog attach="fog" args={["#F9F8F6", 0, 15]} />
      <group ref={groupRef}>
        <Clouds material={THREE.MeshLambertMaterial}>
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
      whileHover={{ width: "60%" }}
      className="relative h-full w-1/2 flex items-center justify-center cursor-pointer overflow-hidden"
      onClick={onSelect}
      aria-label={`Shop ${name}`}
    >
      <div className="absolute inset-0">
        <Image src={image} alt={name} fill className="object-cover" sizes="50vw" priority />
        <div className="absolute inset-0 bg-obsidian/20" />
      </div>
      <div className="relative z-10 text-center">
        <h2 className="font-serif text-5xl text-white tracking-tighter drop-shadow-lg sm:text-7xl">
          {name}
        </h2>
        <p className="mt-2 font-sans text-xs tracking-[0.4em] text-white/80 uppercase">
          Enter Studio
        </p>
      </div>
    </motion.button>
  );
}
