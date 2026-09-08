"use client";
import { useSyncExternalStore } from "react";
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("keepsy-preferences-updated", callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener("keepsy-preferences-updated", callback); };
}
export function useStoredFlag(key: string, serverDefault = true): boolean {
  return useSyncExternalStore(subscribe, () => {
    try { const value = window.localStorage.getItem(key); return value === "true" || value === "1"; }
    catch { return serverDefault; }
  }, () => serverDefault);
}
export function storeFlag(key: string, value: boolean) {
  try { window.localStorage.setItem(key, String(value)); } catch { /* Storage can be unavailable in private browsing. */ }
  window.dispatchEvent(new Event("keepsy-preferences-updated"));
}
