"use client";

import { assessPrintQuality, type PrintQualityRating } from "@/lib/print/quality";

const TONE: Record<PrintQualityRating, { bg: string; fg: string; label: string }> = {
  excellent: { bg: "rgba(44,74,62,0.12)", fg: "var(--color-forest)", label: "Excellent print quality" },
  good: { bg: "rgba(44,74,62,0.10)", fg: "var(--color-forest)", label: "Good print quality" },
  acceptable: { bg: "rgba(201,168,76,0.18)", fg: "#8A6D1F", label: "Acceptable print quality" },
  poor: { bg: "rgba(196,113,74,0.12)", fg: "var(--color-terra-dark)", label: "Low resolution for this size" },
};

/**
 * Honest print-quality indicator for the image that will actually be printed.
 * Renders nothing when dimensions are unknown.
 */
export function PrintQualityBadge({
  productId,
  size,
  width,
  height,
  compact = false,
}: {
  productId: string;
  size?: string | null;
  width?: number | null;
  height?: number | null;
  compact?: boolean;
}) {
  if (!width || !height) return null;
  const q = assessPrintQuality({ productId, size, imageWidth: width, imageHeight: height });
  if (!q) return null;
  const tone = TONE[q.rating];
  return (
    <div
      role="status"
      className={`rounded-xl px-3 ${compact ? "py-1.5 text-[11px]" : "py-2.5 text-xs"} font-semibold leading-snug`}
      style={{ backgroundColor: tone.bg, color: tone.fg }}
      data-print-quality={q.rating}
    >
      <span className="font-extrabold">{tone.label}</span>
      {compact ? null : <span className="block font-medium opacity-90">{q.message}</span>}
      {compact ? <span className="ml-1 font-medium opacity-80">· ~{q.dpi} DPI · {width}×{height}px</span> : null}
    </div>
  );
}
