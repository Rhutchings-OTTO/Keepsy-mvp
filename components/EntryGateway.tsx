"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import type { Region } from "@/lib/region";

const UK_IMAGE = "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1920&q=80";
const US_IMAGE = "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=1920&q=80";

type EntryGatewayProps = {
  onSelect: (region: Region) => void;
};

export function EntryGateway({ onSelect }: EntryGatewayProps) {
  const [hovered, setHovered] = useState<Region | null>(null);
  const [wash, setWash] = useState<{ region: Region; x: number; y: number } | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>, region: Region) => {
    const x = event.clientX;
    const y = event.clientY;
    setWash({ region, x, y });
    setTimeout(() => {
      onSelect(region);
    }, 900);
  };

  const ukWidth = hovered === "UK" ? 60 : hovered === "US" ? 40 : 50;
  const usWidth = hovered === "US" ? 60 : hovered === "UK" ? 40 : 50;

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* UK half */}
      <motion.button
        type="button"
        className="relative flex h-full items-center justify-center overflow-hidden"
        style={{ width: `${ukWidth}%` }}
        onMouseEnter={() => setHovered("UK")}
        onMouseLeave={() => setHovered(null)}
        onClick={(e) => handleClick(e, "UK")}
        aria-label="Shop United Kingdom"
      >
        <motion.div
          className="absolute inset-0"
          animate={{ filter: hovered === "US" ? "grayscale(100%)" : "grayscale(0%)" }}
          transition={{ duration: 0.35 }}
        >
          <Image
            src={UK_IMAGE}
            alt="United Kingdom"
            fill
            className="object-cover"
            sizes="50vw"
            priority
          />
          <div className="absolute inset-0 bg-[#1A1A1A]/15" />
        </motion.div>
        <div className="relative z-10 text-center">
          <motion.span
            className="block font-serif text-4xl font-bold tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl"
            animate={{ scale: hovered === "UK" ? 1.05 : 1 }}
            transition={{ duration: 0.3 }}
          >
            United Kingdom
          </motion.span>
          <p className="mt-2 text-sm font-medium text-white/90 sm:text-base">Shop in GBP · Local delivery</p>
        </div>
      </motion.button>

      {/* US half */}
      <motion.button
        type="button"
        className="relative flex h-full items-center justify-center overflow-hidden"
        style={{ width: `${usWidth}%` }}
        onMouseEnter={() => setHovered("US")}
        onMouseLeave={() => setHovered(null)}
        onClick={(e) => handleClick(e, "US")}
        aria-label="Shop United States"
      >
        <motion.div
          className="absolute inset-0"
          animate={{ filter: hovered === "UK" ? "grayscale(100%)" : "grayscale(0%)" }}
          transition={{ duration: 0.35 }}
        >
          <Image
            src={US_IMAGE}
            alt="United States"
            fill
            className="object-cover"
            sizes="50vw"
            priority
          />
          <div className="absolute inset-0 bg-[#1A1A1A]/15" />
        </motion.div>
        <div className="relative z-10 text-center">
          <motion.span
            className="block font-serif text-4xl font-bold tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl"
            animate={{ scale: hovered === "US" ? 1.05 : 1 }}
            transition={{ duration: 0.3 }}
          >
            United States
          </motion.span>
          <p className="mt-2 text-sm font-medium text-white/90 sm:text-base">Shop in USD · Nationwide shipping</p>
        </div>
      </motion.button>

      {/* Color Wash overlay - expands from click point */}
      <AnimatePresence>
        {wash && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-[101]"
            initial={{ clipPath: `circle(0px at ${wash.x}px ${wash.y}px)` }}
            animate={{ clipPath: `circle(200vmax at ${wash.x}px ${wash.y}px)` }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.2, 0.9, 0.2, 1] }}
            style={{
              backgroundColor: wash.region === "UK" ? "#012169" : "#3C3B6E",
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
