"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Global scroll-to-top on every route change and initial load.
 *
 * - Disables browser scroll restoration so the browser doesn't fight us by
 *   trying to restore a previous session's scroll position.
 * - Resets window + documentElement + body on every pathname change (covers
 *   iOS Safari which sometimes only respects document.body.scrollTop).
 * - Renders nothing — purely a side-effect component.
 */
export function ScrollRestoreToTop() {
  const pathname = usePathname();

  // Disable browser scroll restoration once, on mount.
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }, []);

  // Scroll to top instantly on every route change (and on initial mount).
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0; // iOS Safari
  }, [pathname]);

  return null;
}
