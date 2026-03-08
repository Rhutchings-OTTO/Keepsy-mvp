"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "cookie_notice_dismissed";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable (e.g., private browsing with blocked storage)
    }
  }, []);

  function handleDismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-[9999] border-t shadow-[0_-8px_32px_-8px_rgba(45,41,38,0.15)]"
      style={{
        backgroundColor: "#FDF6EE",
        borderColor: "rgba(45,41,38,0.10)",
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 py-4 sm:flex-row sm:items-center sm:gap-6 sm:px-8">
        <p className="text-sm leading-6" style={{ color: "rgba(45,41,38,0.75)" }}>
          We use a small number of strictly necessary cookies to make this site work — including saving your region preference. No advertising or tracking cookies are used.{" "}
          <Link
            href="/cookies"
            className="font-semibold underline underline-offset-2"
            style={{ color: "var(--color-terracotta)" }}
          >
            Cookie Policy
          </Link>
        </p>
        <button
          onClick={handleDismiss}
          className="shrink-0 rounded-full px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: "var(--color-terracotta)" }}
          aria-label="Accept cookies and dismiss this notice"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
