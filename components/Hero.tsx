"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MagneticLink } from "@/components/ui/MagneticLink";

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.4, ease: "easeOut" },
};

const slideUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" },
};

export function Hero() {
  return (
    <motion.section
      className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-2 md:items-center md:py-20"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <div className="max-w-2xl">
        <motion.p
          className="mb-4 inline-block rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-black/60"
          variants={fadeIn}
        >
          Made for meaningful gifting
        </motion.p>
        <motion.h1
          className="text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl md:text-6xl"
          variants={slideUp}
        >
          Turn your favourite memories into beautiful gifts in minutes.
        </motion.h1>
        <motion.p
          className="mt-5 max-w-xl text-base leading-relaxed text-black/65 sm:text-lg"
          variants={fadeIn}
        >
          Upload a photo, choose a style, and we help you create gift-ready cards, mugs, tees, and hoodies for the people you love.
        </motion.p>
        <motion.div
          className="mt-7 flex flex-wrap items-center gap-3"
          variants={fadeIn}
        >
          <MagneticLink
            href="/create"
            className="inline-block min-h-11 rounded-2xl bg-terracotta px-6 py-3 text-sm font-bold text-white shadow-terra-glow hover:bg-terracotta-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/30"
          >
            Create your gift
          </MagneticLink>
          <MagneticLink
            href="/gift-ideas"
            className="inline-block min-h-11 rounded-2xl border border-charcoal/20 bg-transparent px-6 py-3 text-sm font-bold text-charcoal hover:border-charcoal/40 hover:bg-charcoal/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal/20"
          >
            See gift ideas
          </MagneticLink>
        </motion.div>
      </div>
      <motion.div
        className="grid grid-cols-2 gap-3 sm:gap-4"
        variants={slideUp}
      >
        {/* Plain realistic product mockups */}
        <Image src="/product-tiles/plain-card.png" alt="Family card gift example" width={520} height={520} className="h-full w-full rounded-2xl border border-black/10 object-cover shadow-sm" />
        <Image src="/product-tiles/plain-mug-front.png" alt="Pet mug gift example" width={520} height={520} className="h-full w-full rounded-2xl border border-black/10 object-cover shadow-sm" />
        <Image src="/product-tiles/tee-white.png" alt="Premium tee gift example" width={520} height={520} className="h-full w-full rounded-2xl border border-black/10 object-cover shadow-sm" />
        <Image src="/product-tiles/hoodie-white.png" alt="Anniversary hoodie gift example" width={520} height={520} className="h-full w-full rounded-2xl border border-black/10 object-cover shadow-sm" />
      </motion.div>
    </motion.section>
  );
}
