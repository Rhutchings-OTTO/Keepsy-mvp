"use client";

import { useRef, useState, useCallback } from "react";
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
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (reduceMotion) return;
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setTilt({ x: y * 3, y: -x * 3 });
    },
    [reduceMotion]
  );
  const handleMouseLeave = useCallback(() => setTilt({ x: 0, y: 0 }), []);

  const content = (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-white/25 bg-white/10 p-2 shadow-lg backdrop-blur-md ${className}`}
      style={
        reduceMotion
          ? undefined
          : {
              transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            }
      }
      whileHover={reduceMotion ? undefined : { y: -4, boxShadow: "0 12px 28px rgba(0,0,0,0.08)" }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {image && (
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl">
          {image}
        </div>
      )}
      {title && <div className="mt-1.5 line-clamp-2 shrink-0 text-sm font-bold text-black/85">{title}</div>}
      {subtitle && <div className="line-clamp-1 shrink-0 text-xs text-black/55">{subtitle}</div>}
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
