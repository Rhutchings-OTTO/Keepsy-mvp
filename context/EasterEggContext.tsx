"use client";

import React, { createContext, useCallback, useContext, useRef, useState } from "react";

export type EasterEggMouse = {
  x: number;
  y: number;
  hoverTarget: { x: number; y: number; size: number } | null;
  visible: boolean;
};

const defaultMouse: EasterEggMouse = {
  x: 0,
  y: 0,
  hoverTarget: null,
  visible: false,
};

const EasterEggContext = createContext<EasterEggMouse | null>(null);

export function useEasterEggMouse(): EasterEggMouse | null {
  return useContext(EasterEggContext);
}

type EasterEggProviderProps = {
  children: React.ReactNode;
};

/**
 * Single place for Easter egg event listeners (cursor, magnetic, grain spotlight).
 * One throttled mousemove/mouseleave so we don't drain battery or flood the main thread.
 */
export function EasterEggProvider({ children }: EasterEggProviderProps) {
  const [mouse, setMouse] = useState<EasterEggMouse>(defaultMouse);
  const rafId = useRef<number>(0);
  const latest = useRef({ x: 0, y: 0, hoverTarget: null as EasterEggMouse["hoverTarget"], visible: true });

  const flush = useCallback(() => {
    setMouse({
      x: latest.current.x,
      y: latest.current.y,
      hoverTarget: latest.current.hoverTarget,
      visible: latest.current.visible,
    });
    rafId.current = 0;
  }, []);

  const scheduleFlush = useCallback(() => {
    if (rafId.current !== 0) return;
    rafId.current = requestAnimationFrame(flush);
  }, [flush]);

  const handleMove = useCallback(
    (e: MouseEvent) => {
      latest.current.x = e.clientX;
      latest.current.y = e.clientY;
      latest.current.visible = true;

      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      const interactive = el?.closest("button, a, [data-cursor-swallow]");
      if (interactive) {
        const rect = interactive.getBoundingClientRect();
        const pad = 12;
        latest.current.hoverTarget = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          size: Math.max(rect.width, rect.height) + pad * 2,
        };
      } else {
        latest.current.hoverTarget = null;
      }

      scheduleFlush();
    },
    [scheduleFlush]
  );

  const handleLeave = useCallback(() => {
    latest.current.visible = false;
    latest.current.hoverTarget = null;
    scheduleFlush();
  }, [scheduleFlush]);

  React.useEffect(() => {
    document.addEventListener("mousemove", handleMove, { passive: true });
    document.addEventListener("mouseleave", handleLeave);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseleave", handleLeave);
      if (rafId.current !== 0) cancelAnimationFrame(rafId.current);
    };
  }, [handleMove, handleLeave]);

  return (
    <EasterEggContext.Provider value={mouse}>
      {children}
    </EasterEggContext.Provider>
  );
}
