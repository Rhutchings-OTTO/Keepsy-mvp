"use client";

import { useEffect, useRef } from "react";

type MouseGlowProps = {
  className?: string;
};

/** Renders a mouse-following radial glow overlay. Attach to a positioned container. */
export function MouseGlow({ className = "" }: MouseGlowProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const parent = el.parentElement;
    if (!parent) return;

    const handleMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty("--x", `${x}px`);
      el.style.setProperty("--y", `${y}px`);
    };

    parent.addEventListener("mousemove", handleMove);
    return () => parent.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div
      ref={ref}
      className={`pointer-events-none absolute inset-0 mouse-glow ${className}`}
      aria-hidden
    />
  );
}
