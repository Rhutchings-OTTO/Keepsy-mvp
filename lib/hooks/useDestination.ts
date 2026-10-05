"use client";
/**
 * Delivery-country selection for the browser.
 *
 * Source of truth is the `keepsy_country` cookie (server routes read it too).
 * The legacy `keepsy_region` cookie/localStorage is kept in sync so existing
 * pricing/content code keeps working. Returns null until the customer has
 * chosen (or the server suggested) a country.
 */
import { useSyncExternalStore } from "react";
import { setRegion } from "@/lib/region";
import {
  DESTINATION_COOKIE,
  DESTINATION_EVENT,
  countryForRegion,
  getCountry,
  normaliseCountryCode,
  type CountryCode,
} from "@/lib/commerce/markets";

const ONE_YEAR = 60 * 60 * 24 * 365;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1] ?? "") : null;
}

/** Current destination country from cookie → legacy region → null. */
export function getDestination(): CountryCode | null {
  const fromCookie = normaliseCountryCode(readCookie(DESTINATION_COOKIE));
  if (fromCookie && getCountry(fromCookie)) return fromCookie;
  const legacy =
    readCookie("keepsy_region") ||
    (typeof window !== "undefined"
      ? window.localStorage.getItem("keepsy_region")
      : null);
  return countryForRegion(legacy === "UK" || legacy === "US" ? legacy : null);
}

export function setDestination(code: CountryCode): void {
  const country = getCountry(code);
  if (!country) return;
  if (typeof document !== "undefined") {
    document.cookie = `${DESTINATION_COOKIE}=${encodeURIComponent(country.code)}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
  }
  // Keep the legacy region in sync (drives currency + regional catalogue ids).
  setRegion(country.region);
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event(DESTINATION_EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(DESTINATION_EVENT, callback);
  window.addEventListener("keepsy-region-set", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(DESTINATION_EVENT, callback);
    window.removeEventListener("keepsy-region-set", callback);
  };
}

export function useDestination(): CountryCode | null {
  return useSyncExternalStore(subscribe, getDestination, () => null);
}
