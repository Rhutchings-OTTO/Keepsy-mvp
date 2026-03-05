"use client";

import { createContext, useContext, useCallback, useState, useRef, useEffect } from "react";

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

/** Plays a subtle ambient tone when generation is active. Stops exactly when generation ends. */
export function SonicBoomEffect() {
  const ctx = useGeneration();
  const audioRef = useRef<{ ctx: AudioContext; osc: OscillatorNode; gain: GainNode } | null>(null);

  useEffect(() => {
    if (!ctx?.isGenerating) {
      if (audioRef.current) {
        try {
          audioRef.current.gain.gain.setTargetAtTime(0, audioRef.current.ctx.currentTime, 0.05);
          audioRef.current.osc.stop(audioRef.current.ctx.currentTime + 0.1);
        } catch {
          // ignore if already stopped
        }
        audioRef.current = null;
      }
      return;
    }

    if (typeof window === "undefined") return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(220, audioCtx.currentTime);
      osc.frequency.setValueAtTime(264, audioCtx.currentTime + 2);
      osc.frequency.setValueAtTime(330, audioCtx.currentTime + 4);
      osc.type = "sine";
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.03, audioCtx.currentTime + 0.3);
      osc.start(audioCtx.currentTime);

      audioRef.current = { ctx: audioCtx, osc, gain };
    } catch {
      audioRef.current = null;
    }

    return () => {
      if (audioRef.current) {
        try {
          audioRef.current.gain.gain.setTargetAtTime(0, audioRef.current.ctx.currentTime, 0.05);
          audioRef.current.osc.stop(audioRef.current.ctx.currentTime + 0.1);
        } catch {
          // ignore
        }
        audioRef.current = null;
      }
    };
  }, [ctx?.isGenerating]);

  return null;
}
