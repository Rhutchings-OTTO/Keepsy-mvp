"use client";

import { motion } from "framer-motion";
import { useReducedMotionPref } from "@/lib/motion/useReducedMotionPref";

type InteractiveCardProps = {
  title?: string;
  subtitle?: string;
  image?: React.ReactNode;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
  href?: string;
};

export function InteractiveCard({
  title,
  subtitle,
  image,
  onClick,
  children,
  className = "",
  href,
}: InteractiveCardProps) {
  const reduceMotion = useReducedMotionPref();

  const content = (
    <motion.div
      className={`group relative overflow-hidden rounded-2xl border border-white/25 bg-white/10 p-3 shadow-lg backdrop-blur-md ${className}`}
      whileHover={reduceMotion ? undefined : { y: -4, boxShadow: "0 12px 28px rgba(0,0,0,0.08)" }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {image && <div className="overflow-hidden rounded-xl">{image}</div>}
      {title && <div className="mt-2 font-bold text-black/85">{title}</div>}
      {subtitle && <div className="text-sm text-black/55">{subtitle}</div>}
      {children}
    </motion.div>
  );

  if (href) {
    return (
      <a href={href} className="block outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 rounded-2xl">
        {content}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 rounded-2xl">
        {content}
      </button>
    );
  }
  return content;
}
