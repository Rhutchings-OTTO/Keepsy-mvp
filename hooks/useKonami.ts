"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const KONAMI_SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "KeyB",
  "KeyA",
];

/**
 * Listens for the Konami code (↑↑↓↓←→←→BA) and calls onTrigger when detected.
 * Properly cleans up the keydown listener on unmount.
 */
export function useKonami(onTrigger: () => void): void {
  const onTriggerRef = useRef(onTrigger);
  onTriggerRef.current = onTrigger;
  const sequenceIndex = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const expected = KONAMI_SEQUENCE[sequenceIndex.current];
      if (e.code === expected) {
        sequenceIndex.current++;
        if (sequenceIndex.current === KONAMI_SEQUENCE.length) {
          sequenceIndex.current = 0;
          onTriggerRef.current();
        }
      } else {
        sequenceIndex.current = 0;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
