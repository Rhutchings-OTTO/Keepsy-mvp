"use client";

import { useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useGeneration } from "@/context/GenerationContext";

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

  const content = (
    <motion.div className="inline-block">
      <motion.svg
        viewBox="0 0 200 48"
        width={width}
        height={(width / 200) * 48}
        className={`inline-block overflow-visible ${className}`}
        role="img"
        aria-label="Keepsy"
        initial={false}
        animate={isGenerating && !reduceMotion ? { opacity: [1, 0.88, 1] } : { opacity: 1 }}
        transition={isGenerating && !reduceMotion ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" } : undefined}
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
                  values="0.015 0.015;0.03 0.032;0.015 0.015"
                  dur="2.8s"
                  repeatCount="indefinite"
                />
              )}
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={isGenerating ? 3 : 0}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>

        <motion.g
          onHoverStart={() => !reduceMotion && setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
        >
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
            fontFamily="var(--font-serif), Fraunces, Georgia, serif"
            fontSize="40"
            fontWeight="700"
            initial={false}
            animate={{
              letterSpacing: `${tracking + (isHovered && !reduceMotion ? 0.018 : 0)}em`,
            }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
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
      <Link href={href} className={wrapperClass} aria-label="Keepsy homepage">
        {content}
      </Link>
    );
  }

  return content;
}
