"use client";

import { useEffect, useState } from "react";

const POLL_INTERVAL_MS = 6_000;

/** Polls /api/status for overload state (≥90% generation capacity). Use ?panic=1 on the page URL to force demo mode. */
export function usePanicMode(): boolean {
  const [panic, setPanic] = useState(false);

  useEffect(() => {
    const isDemo = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("panic") === "1";
    const fetchStatus = async () => {
      try {
        const url = isDemo ? "/api/status?demo=1" : "/api/status";
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { panic?: boolean };
        setPanic(Boolean(data.panic));
      } catch {
        setPanic(false);
      }
    };

    void fetchStatus();
    const id = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return panic;
}
