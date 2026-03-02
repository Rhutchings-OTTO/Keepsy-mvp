export type Region = "US" | "UK";

const REGION_COOKIE_KEY = "keepsy_region";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function parseRegion(value: string | null | undefined): Region | null {
  if (value === "US" || value === "UK") return value;
  return null;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.split("=")[1] ?? "");
}

export function getRegion(): Region | null {
  const cookieRegion = parseRegion(readCookie(REGION_COOKIE_KEY));
  if (cookieRegion) return cookieRegion;
  if (typeof window === "undefined") return null;
  const localRegion = parseRegion(window.localStorage.getItem(REGION_COOKIE_KEY));
  return localRegion;
}

export function setRegion(region: Region): void {
  if (typeof document !== "undefined") {
    document.cookie = `${REGION_COOKIE_KEY}=${encodeURIComponent(region)}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
  }
  if (typeof window !== "undefined") {
    window.localStorage.setItem(REGION_COOKIE_KEY, region);
  }
}

export function regionFromPathOrHost(pathname?: string, hostname?: string): Region | null {
  const path = pathname?.toLowerCase() ?? "";
  const host = hostname?.toLowerCase() ?? "";
  if (path.startsWith("/us") || host.endsWith(".us")) return "US";
  if (path.startsWith("/uk") || host.endsWith(".uk")) return "UK";
  return null;
}

