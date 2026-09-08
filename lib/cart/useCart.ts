"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  CART_STORAGE_KEY,
  CART_UPDATED_EVENT,
  getCart,
  reloadCart,
  subscribeCart,
  type CartLine,
} from "./store";

const EMPTY: CartLine[] = [];

function getServerSnapshot(): CartLine[] {
  return EMPTY;
}

/**
 * React binding for the shared cart. Also listens for cross-tab `storage`
 * events and the legacy `cart-updated` window event.
 */
export function useCart(): CartLine[] {
  const lines = useSyncExternalStore(subscribeCart, getCart, getServerSnapshot);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === null || e.key === CART_STORAGE_KEY) reloadCart();
    }
    function onLegacy() {
      reloadCart();
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener(CART_UPDATED_EVENT, onLegacy);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CART_UPDATED_EVENT, onLegacy);
    };
  }, []);

  return lines;
}
