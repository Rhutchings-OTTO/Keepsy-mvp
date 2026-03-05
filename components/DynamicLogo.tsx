"use client";

import { useId, useState, useRef, useEffect } from "react";
import { motion, useReducedMotion, useMotionValue, useSpring } from "framer-motion";
import Link from "next/link";
import { useGeneration } from "@/context/GenerationContext";
import { useEasterEggMouse } from "@/context/EasterEggContext";

const MAGNETIC_RADIUS = 20;

type DynamicLogoProps = {
  href?: string | null;
  onClick?: () => void;
  className?: string;
  /** Override isGenerating when outside GenerationProvider */
  isGenerating?: boolean;
  /** Base letter-spacing in em. Bloom adds ~0.04em on hover. */
  tracking?: number;
  /** Width in pixels. Height scales to maintain aspect. */
  width?: number;
};

export function DynamicLogo({
  href = "/",
  onClick,
  className = "",
  isGenerating: isGeneratingProp,
  tracking = 0.02,
  width = 140,
}: DynamicLogoProps) {
  const filterId = useId().replace(/:/g, "-");
  const ctx = useGeneration();
  const reduceMotion = useReducedMotion();
  const isGenerating = isGeneratingProp ?? ctx?.isGenerating ?? false;
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null);

  const easterEggMouse = useEasterEggMouse();
  const offsetX = useMotionValue(0);
  const offsetY = useMotionValue(0);
  const springX = useSpring(offsetX, { stiffness: 400, damping: 30 });
  const springY = useSpring(offsetY, { stiffness: 400, damping: 30 });

  useEffect(() => {
    if (reduceMotion) return;
    const el = ref.current;
    if (!el) return;

    if (easterEggMouse !== null) {
      const { x: mx, y: my } = easterEggMouse;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = mx - cx;
      const dy = my - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MAGNETIC_RADIUS && dist > 0) {
        const strength = 1 - dist / MAGNETIC_RADIUS;
        const clamp = (v: number) => Math.max(-MAGNETIC_RADIUS, Math.min(MAGNETIC_RADIUS, v));
        offsetX.set(clamp(dx * strength));
        offsetY.set(clamp(dy * strength));
      } else {
        offsetX.set(0);
        offsetY.set(0);
      }
      return;
    }

    const handleMove = (e: Event) => {
      const ev = e as MouseEvent;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = ev.clientX - cx;
      const dy = ev.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MAGNETIC_RADIUS && dist > 0) {
        const strength = 1 - dist / MAGNETIC_RADIUS;
        const clamp = (v: number) => Math.max(-MAGNETIC_RADIUS, Math.min(MAGNETIC_RADIUS, v));
        offsetX.set(clamp(dx * strength));
        offsetY.set(clamp(dy * strength));
      } else {
        offsetX.set(0);
        offsetY.set(0);
      }
    };

    const handleLeave = () => {
      offsetX.set(0);
      offsetY.set(0);
    };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [easterEggMouse?.x, easterEggMouse?.y, reduceMotion, offsetX, offsetY]);

  const content = (
    <motion.div
      className="inline-block"
      style={
        reduceMotion
          ? undefined
          : { x: springX, y: springY }
      }
    >
      <motion.svg
      viewBox="0 0 200 48"
      width={width}
      height={(width / 200) * 48}
      className={`inline-block overflow-visible ${className}`}
      role="img"
      aria-label="Keepsy"
      initial={false}
      animate={{
        scale: reduceMotion ? 1 : [1, 1.02, 1],
        transition: {
          scale: {
            duration: 3.2,
            repeat: Infinity,
            ease: "easeInOut",
          },
        },
      }}
      style={{
        filter: isGenerating ? `url(#${filterId})` : undefined,
      }}
    >
      <defs>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.015"
            numOctaves={3}
            result="noise"
          >
            {isGenerating && (
              <animate
                attributeName="baseFrequency"
                values="0.015 0.015;0.035 0.04;0.015 0.015"
                dur="2.5s"
                repeatCount="indefinite"
              />
            )}
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={isGenerating ? 6 : 0}
            xChannelSelector="R"
            yChannelSelector="G"
          >
            {isGenerating && (
              <animate
                attributeName="scale"
                values="0;8;4;8;0"
                dur="2s"
                repeatCount="indefinite"
              />
            )}
          </feDisplacementMap>
        </filter>
      </defs>

      <motion.g
        onHoverStart={() => !reduceMotion && setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        {/* Invisible rect extends hover area to full logo */}
        <rect
          x="0"
          y="0"
          width="200"
          height="48"
          fill="transparent"
          className="cursor-pointer"
        />
        <motion.text
          x="0"
          y="36"
          fill="currentColor"
          fontFamily="var(--font-serif), Playfair Display, Georgia, serif"
          fontSize="40"
          fontWeight="700"
          initial={false}
          animate={{
            letterSpacing: `${tracking + (isHovered && !reduceMotion ? 0.04 : 0)}em`,
          }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            transform: "translate(0, -8px)",
            transformOrigin: "left center",
          }}
        >
          Keepsy
        </motion.text>
      </motion.g>
    </motion.svg>
    </motion.div>
  );

  const wrapperClass =
    "inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 rounded";

  if (onClick) {
    return (
      <button
        ref={ref as React.RefObject<HTMLButtonElement>}
        type="button"
        onClick={onClick}
        className={wrapperClass}
        aria-label="Keepsy homepage"
      >
        {content}
      </button>
    );
  }

  if (href) {
    return (
      <Link ref={ref as React.RefObject<HTMLAnchorElement>} href={href} className={wrapperClass} aria-label="Keepsy homepage">
        {content}
      </Link>
    );
  }

  return content;
}
