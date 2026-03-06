"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useKonami } from "@/hooks/useKonami";

const INK_BLEED_DURATION_MS = 2000;

type AtelierModeContextValue = {
  isAtelierMode: boolean;
  isTransitioning: boolean;
};

const AtelierModeContext = createContext<AtelierModeContextValue>({
  isAtelierMode: false,
  isTransitioning: false,
});

export function useAtelierMode() {
  return useContext(AtelierModeContext);
}

type AtelierModeProviderProps = {
  children: React.ReactNode;
};

export function AtelierModeProvider({ children }: AtelierModeProviderProps) {
  const [isAtelierMode, setIsAtelierMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleMode = useCallback(() => {
    setIsTransitioning(true);
    setIsAtelierMode((prev) => !prev);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
      timeoutRef.current = null;
    }, INK_BLEED_DURATION_MS);
  }, []);

  useKonami(toggleMode);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isAtelierMode) {
      root.classList.add("atelier-mode");
    } else {
      root.classList.remove("atelier-mode");
    }
    return () => root.classList.remove("atelier-mode");
  }, [isAtelierMode]);

  return (
    <AtelierModeContext.Provider value={{ isAtelierMode, isTransitioning }}>
      {children}
      {isTransitioning && (
        <div
          className={isAtelierMode ? "ink-bleed-overlay ink-bleed-in" : "ink-bleed-overlay ink-bleed-out"}
          aria-hidden
        />
      )}
    </AtelierModeContext.Provider>
  );
}
