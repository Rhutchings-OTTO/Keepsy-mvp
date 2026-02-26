"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const FLOATING_ITEMS = [
  { id: "tee", label: "T-Shirt", src: "/product-tiles/tee.jpg", x: "8%", y: "18%", speed: 0.015 },
  { id: "mug", label: "Mug", src: "/product-tiles/mug.jpg", x: "76%", y: "18%", speed: -0.012 },
  { id: "card", label: "Card", src: "/product-tiles/card.jpg", x: "18%", y: "68%", speed: -0.02 },
  { id: "hoodie", label: "Hoodie", src: "/product-tiles/hoodie.jpg", x: "70%", y: "68%", speed: 0.018 },
];

export function SplashLanding() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  return (
    <section
      className="relative min-h-screen overflow-hidden bg-[#F7F1EB]"
      onMouseMove={(e) => {
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = (e.clientY / window.innerHeight) * 2 - 1;
        setMouse({ x, y });
      }}
    >
      <div className="pointer-events-none absolute inset-0">
        {FLOATING_ITEMS.map((item) => (
          <motion.div
            key={item.id}
            style={{
              left: item.x,
              top: item.y,
              transform: `translate(${mouse.x * 100 * item.speed}px, ${mouse.y * 80 * item.speed}px)`,
            }}
            className="absolute hidden w-40 rounded-2xl border border-black/10 bg-white/80 p-2 shadow-xl backdrop-blur md:block"
          >
            <Image src={item.src} alt={`${item.label} generated example`} width={260} height={200} className="h-28 w-full rounded-xl object-cover" />
            <p className="mt-2 text-xs font-bold text-black/70">{item.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 text-center">
        <p className="mb-5 rounded-full bg-white/80 px-4 py-1 text-xs font-extrabold uppercase tracking-widest text-black/60">
          AI-Powered Creativity
        </p>
        <h1 className="text-5xl font-black leading-[1.04] tracking-tight text-[#151821] sm:text-7xl">
          Imagine it. Generate it.
          <br />
          <motion.span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(90deg,#7DB9E8,#F8C8DC,#FFD194,#B19CD9)",
              backgroundSize: "220% auto",
              backgroundPositionX: `${50 + mouse.x * 12}%`,
            }}
          >
            Cherish it.
          </motion.span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg font-semibold text-black/60">
          Turn your favorite memories and wildest ideas into professional-grade merchandise with Keepsy&apos;s high-fidelity AI.
        </p>
        <Link
          href="/home"
          className="mt-10 min-h-11 rounded-2xl bg-black px-8 py-3 text-sm font-bold text-white shadow-sm hover:bg-black/90"
        >
          Enter site
        </Link>
      </div>
    </section>
  );
}
