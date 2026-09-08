"use client";
import { useSyncExternalStore } from "react";
import { getRegion } from "@/lib/region";
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("keepsy-region-set", callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener("keepsy-region-set", callback); };
}
export function useRegion() { return useSyncExternalStore(subscribe, getRegion, () => null); }
