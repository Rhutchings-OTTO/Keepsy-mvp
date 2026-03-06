"use client";

import { createContext, useContext, useCallback, useState } from "react";

type GenerationContextShape = {
  isGenerating: boolean;
  startGeneration: () => void;
  endGeneration: () => void;
};

const GenerationContext = createContext<GenerationContextShape | null>(null);

export function GenerationProvider({ children }: { children: React.ReactNode }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const startGeneration = useCallback(() => setIsGenerating(true), []);
  const endGeneration = useCallback(() => setIsGenerating(false), []);

  return (
    <GenerationContext.Provider value={{ isGenerating, startGeneration, endGeneration }}>
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
