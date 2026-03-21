"use client";

import { createContext, useContext, useCallback, useState } from "react";

type GenerationContextShape = {
  isGenerating: boolean;
  hasGenerated: boolean;
  startGeneration: () => void;
  endGeneration: () => void;
  markGenerated: () => void;
};

const GenerationContext = createContext<GenerationContextShape | null>(null);

export function GenerationProvider({ children }: { children: React.ReactNode }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const startGeneration = useCallback(() => setIsGenerating(true), []);
  const endGeneration = useCallback(() => setIsGenerating(false), []);
  const markGenerated = useCallback(() => setHasGenerated(true), []);

  return (
    <GenerationContext.Provider value={{ isGenerating, hasGenerated, startGeneration, endGeneration, markGenerated }}>
      {children}
    </GenerationContext.Provider>
  );
}

export function useGeneration() {
  const ctx = useContext(GenerationContext);
  if (!ctx) return null;
  return ctx;
}

export function SonicBoomEffect() {
  return null;
}
