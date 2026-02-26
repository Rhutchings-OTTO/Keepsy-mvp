"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const FLOATING_EXAMPLES = [
  {
    id: "family-tee",
    label: "Family Portrait Tee",
    product: "T-Shirt",
    image:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&q=80",
    className: "top-[12%] left-[6%] w-40",
  },
  {
    id: "pet-mug",
    label: "Pet Memory Mug",
    product: "Mug",
    image:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&q=80",
    className: "top-[24%] right-[8%] w-44",
  },
  {
    id: "cartoon-hoodie",
    label: "Cartoon Hoodie",
    product: "Hoodie",
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80",
    className: "bottom-[25%] left-[12%] w-48",
  },
  {
    id: "kids-card",
    label: "Kids Art Card",
    product: "Card",
    image:
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&q=80",
    className: "bottom-[12%] right-[12%] w-40",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F7F1EB] text-[#23211F]">
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute -top-24 -left-20 h-80 w-80 rounded-full bg-sky-300/25 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-20 right-0 h-96 w-96 rounded-full bg-pink-300/25 blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Image src="/keepsy-logo.png" alt="Keepsy" width={300} height={86} className="h-14 w-auto object-contain" />
        <Link href="/create" className="rounded-full bg-black px-5 py-2 text-sm font-bold text-white hover:bg-black/90">
          Start Creating
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[80vh] max-w-7xl items-center px-6 pb-14">
        <div className="max-w-3xl">
          <p className="mb-4 inline-block rounded-full bg-white/80 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-black/60">
            AI Image Generation for Gifts
          </p>
          <h1 className="text-5xl font-black leading-tight md:text-7xl">
            The world is your oyster.
            <br />
            Turn any memory into a masterpiece.
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-semibold text-black/60">
            Generate stunning family portraits, pet art, and cartoon creations, then instantly preview them on hoodies, cards, mugs, and t-shirts.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/create" className="rounded-2xl bg-black px-7 py-4 font-extrabold text-white shadow-lg hover:bg-black/90">
              Enter Image Studio
            </Link>
            <a href="#examples" className="rounded-2xl border border-black/15 bg-white/80 px-7 py-4 font-extrabold hover:bg-white">
              See Live Examples
            </a>
          </div>
        </div>

        <div id="examples" className="pointer-events-none absolute inset-0 hidden lg:block">
          {FLOATING_EXAMPLES.map((example, i) => (
            <motion.div
              key={example.id}
              className={`absolute ${example.className} rounded-2xl border border-black/10 bg-white/80 p-2 shadow-xl backdrop-blur`}
              animate={{ y: [0, i % 2 === 0 ? -12 : 12, 0], rotate: [0, i % 2 === 0 ? 1.2 : -1.2, 0] }}
              transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src={example.image}
                alt={example.label}
                width={240}
                height={160}
                className="h-28 w-full rounded-xl object-cover"
              />
              <div className="mt-2 text-xs font-bold text-black/75">{example.label}</div>
              <div className="text-[11px] font-semibold text-black/50">{example.product} preview</div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
