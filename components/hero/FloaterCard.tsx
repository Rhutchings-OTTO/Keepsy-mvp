"use client";

import Image from "next/image";
import Link from "next/link";
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
  href?: string;
};

export function FloaterCard({ image, alt, title, subtitle, className = "", href }: FloaterCardProps) {
  const reduceMotion = useReducedMotionPref();

  const card = (
    <motion.div
      className={`flex flex-col overflow-hidden rounded-2xl border border-white/25 bg-white/80 p-2.5 shadow-lg backdrop-blur-sm ${className}`}
      whileHover={reduceMotion ? undefined : { y: -2, boxShadow: "0 12px 24px rgba(0,0,0,0.08)" }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Image area: fixed aspect ratio, light bg */}
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-gray-50/80">
        <Image
          src={image}
          alt={alt}
          fill
          sizes="(max-width: 640px) 120px, 200px"
          className="object-cover"
        />
      </div>
      {/* Title: 14-16px, 2 lines max - pb-1 prevents descender clipping */}
      <p className="mt-1.5 line-clamp-2 pb-1 text-[15px] font-bold leading-[1.25] text-black/85">
        {title}
      </p>
      {/* Subtitle: 12-13px, 1 line, muted */}
      <p className="mt-0.5 line-clamp-1 text-xs text-black/55">{subtitle}</p>
    </motion.div>
  );

  if (href) {
    return <Link href={href} className="block h-full w-full">{card}</Link>;
  }
  return card;
}
