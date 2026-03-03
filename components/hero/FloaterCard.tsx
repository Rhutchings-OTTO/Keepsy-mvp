"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useReducedMotionPref } from "@/lib/motion/useReducedMotionPref";

/**
 * Original floater tile layout: glass card with fixed aspect image,
 * readable title/subtitle. Used for hero landing floaters only.
 */
type FloaterCardProps = {
  image: string;
  alt: string;
  title: string;
  subtitle: string;
  className?: string;
};

export function FloaterCard({ image, alt, title, subtitle, className = "" }: FloaterCardProps) {
  const reduceMotion = useReducedMotionPref();

  return (
    <motion.div
      className={`flex flex-col overflow-hidden rounded-2xl border border-white/25 bg-white/80 p-2.5 shadow-lg backdrop-blur-sm ${className}`}
      whileHover={reduceMotion ? undefined : { y: -2, boxShadow: "0 12px 24px rgba(0,0,0,0.08)" }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Image area: fixed aspect ratio, light bg, ~96-110px height at 200px width */}
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-gray-50/80">
        <Image
          src={image}
          alt={alt}
          fill
          sizes="(max-width: 640px) 120px, 200px"
          className="object-cover"
        />
      </div>
      {/* Title: 14-16px, 2 lines max */}
      <p className="mt-1.5 line-clamp-2 text-[15px] font-bold leading-snug text-black/85">
        {title}
      </p>
      {/* Subtitle: 12-13px, 1 line, muted */}
      <p className="mt-0.5 line-clamp-1 text-xs text-black/55">{subtitle}</p>
    </motion.div>
  );
}
