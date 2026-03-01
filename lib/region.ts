export type Region = "US" | "UK";

const REGION_KEY = "keepsy_region";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const cookie of cookies) {
    const [k, ...rest] = cookie.split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function normalizeRegion(value: string | null | undefined): Region | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  if (upper === "US" || upper === "UK") return upper;
  return null;
}

export function getRegion(): Region | null {
  const cookieRegion = normalizeRegion(readCookie(REGION_KEY));
  if (cookieRegion) return cookieRegion;

  if (typeof window !== "undefined") {
    const stored = normalizeRegion(window.localStorage.getItem(REGION_KEY));
    if (stored) return stored;
  }

  return null;
}

export function setRegion(region: Region): void {
  if (typeof document !== "undefined") {
    document.cookie = `${REGION_KEY}=${encodeURIComponent(region)}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
  }
  if (typeof window !== "undefined") {
    window.localStorage.setItem(REGION_KEY, region);
  }
}

export function regionFromPathOrHost(): Region | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname.toLowerCase();
  const path = window.location.pathname.toLowerCase();

  if (host.endsWith(".co.uk") || path.startsWith("/uk")) return "UK";
  if (host.endsWith(".com") || path.startsWith("/us")) return "US";

  return null;
}

export const REGION_COOKIE_KEY = REGION_KEY;

