"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import {
  TSHIRT_IMPERIAL,
  TSHIRT_METRIC,
  HOODIE_IMPERIAL,
  HOODIE_METRIC,
  type SizeChartData,
  type SizeLabel,
} from "@/content/sizeCharts";
import type { Region } from "@/lib/region";

type Unit = "imperial" | "metric";

/** Inline SVG garment diagram showing where measurements are taken. */
function GarmentDiagram({ productType }: { productType: "tshirt" | "hoodie" }) {
  const gc = "#B0A090"; // garment stroke — muted warm
  const gf = "#F5EDE0"; // garment fill — warm cream
  const mc = "#6B5044"; // measurement lines — darker warm brown

  // Two separate arrowhead markers (start ← and end →) for reliable cross-browser rendering
  const arrowEnd = (
    <marker id={`ae-${productType}`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0,0 L7,3.5 L0,7 Z" fill={mc} />
    </marker>
  );
  const arrowStart = (
    <marker id={`as-${productType}`} markerWidth="7" markerHeight="7" refX="1" refY="3.5" orient="auto">
      <path d="M7,0 L0,3.5 L7,7 Z" fill={mc} />
    </marker>
  );
  const mStart = `url(#as-${productType})`;
  const mEnd = `url(#ae-${productType})`;

  const labelProps = {
    fontSize: 9,
    fill: mc,
    fontWeight: 600 as const,
    fontFamily: "var(--font-sans, system-ui, sans-serif)",
  };

  if (productType === "tshirt") {
    // viewBox 300×190. Shirt body: left x=88, right x=212, shoulder y=38, armpit y=82, hem y=166
    // Sleeves: left tip (16,56)–(16,74), right tip (284,56)–(284,74)
    return (
      <svg viewBox="0 0 300 190" style={{ width: "100%", height: 210, display: "block" }} aria-hidden>
        <defs>{arrowEnd}{arrowStart}</defs>

        {/* T-shirt silhouette */}
        <path
          d="M 118,38 L 88,38 L 16,56 L 16,74 L 88,82 L 88,166 L 212,166 L 212,82 L 284,74 L 284,56 L 212,38 L 182,38 Q 150,54 118,38 Z"
          fill={gf} stroke={gc} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"
        />

        {/* ── Width ──────────────────────────────────────── */}
        {/* tick marks */}
        <line x1="88" y1="110" x2="88" y2="122" stroke={mc} strokeWidth="1" />
        <line x1="212" y1="110" x2="212" y2="122" stroke={mc} strokeWidth="1" />
        {/* double-headed arrow */}
        <line x1="92" y1="116" x2="208" y2="116"
          stroke={mc} strokeWidth="1.5" markerStart={mStart} markerEnd={mEnd} />
        <text x="150" y="130" textAnchor="middle" {...labelProps}>Width</text>

        {/* ── Length ─────────────────────────────────────── */}
        {/* tick marks */}
        <line x1="70" y1="38" x2="84" y2="38" stroke={mc} strokeWidth="1" />
        <line x1="70" y1="166" x2="84" y2="166" stroke={mc} strokeWidth="1" />
        {/* double-headed arrow */}
        <line x1="77" y1="43" x2="77" y2="161"
          stroke={mc} strokeWidth="1.5" markerStart={mStart} markerEnd={mEnd} />
        {/* rotated label */}
        <text x="63" y="102" textAnchor="middle" transform="rotate(-90,63,102)" {...labelProps}>Length</text>

        {/* ── Sleeve length (center neck → right sleeve tip, above garment) ── */}
        <line x1="154" y1="30" x2="280" y2="50"
          stroke={mc} strokeWidth="1.5" strokeDasharray="4,2.5"
          markerStart={mStart} markerEnd={mEnd} />
        <text x="218" y="22" textAnchor="middle" {...labelProps}>Sleeve length</text>
      </svg>
    );
  }

  // Hoodie. viewBox 300×215.
  // Hood dome: shoulder base y=72, peak Q 150,8. Body: armpit y=114, hem y=196.
  // Sleeves: left tip (16,86)–(16,104), right tip (284,86)–(284,104)
  return (
    <svg viewBox="0 0 300 215" style={{ width: "100%", height: 230, display: "block" }} aria-hidden>
      <defs>{arrowEnd}{arrowStart}</defs>

      {/* Hoodie silhouette (hood + body + sleeves as one path) */}
      <path
        d="M 16,86 L 16,104 L 88,114 L 88,196 L 212,196 L 212,114 L 284,104 L 284,86 L 212,72 Q 150,8 88,72 L 16,86 Z"
        fill={gf} stroke={gc} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"
      />
      {/* Hood face opening — open arc inside the hood */}
      <path d="M 113,52 Q 150,67 187,52"
        fill="none" stroke={gc} strokeWidth="1.2" strokeLinecap="round" />

      {/* ── Width ──────────────────────────────────────── */}
      <line x1="88" y1="148" x2="88" y2="160" stroke={mc} strokeWidth="1" />
      <line x1="212" y1="148" x2="212" y2="160" stroke={mc} strokeWidth="1" />
      <line x1="92" y1="154" x2="208" y2="154"
        stroke={mc} strokeWidth="1.5" markerStart={mStart} markerEnd={mEnd} />
      <text x="150" y="168" textAnchor="middle" {...labelProps}>Width</text>

      {/* ── Length (shoulder base → hem) ────────────── */}
      <line x1="70" y1="72" x2="84" y2="72" stroke={mc} strokeWidth="1" />
      <line x1="70" y1="196" x2="84" y2="196" stroke={mc} strokeWidth="1" />
      <line x1="77" y1="77" x2="77" y2="191"
        stroke={mc} strokeWidth="1.5" markerStart={mStart} markerEnd={mEnd} />
      <text x="63" y="134" textAnchor="middle" transform="rotate(-90,63,134)" {...labelProps}>Length</text>

      {/* ── Sleeve length (center hood base → right sleeve tip, above garment) ── */}
      <line x1="154" y1="64" x2="280" y2="80"
        stroke={mc} strokeWidth="1.5" strokeDasharray="4,2.5"
        markerStart={mStart} markerEnd={mEnd} />
      <text x="218" y="56" textAnchor="middle" {...labelProps}>Sleeve length</text>
    </svg>
  );
}

export type SizeGuideDrawerProps = {
  open: boolean;
  onClose: () => void;
  productType: "tshirt" | "hoodie";
  region: Region;
};

function getChart(productType: "tshirt" | "hoodie", unit: Unit): SizeChartData {
  if (productType === "tshirt") return unit === "imperial" ? TSHIRT_IMPERIAL : TSHIRT_METRIC;
  return unit === "imperial" ? HOODIE_IMPERIAL : HOODIE_METRIC;
}

function getDefaultUnit(region: Region): Unit {
  return region === "UK" ? "metric" : "imperial";
}

function getUnitLabel(unit: Unit): string {
  return unit === "imperial" ? "in" : "cm";
}

export function SizeGuideDrawer({
  open,
  onClose,
  productType,
  region,
}: SizeGuideDrawerProps) {
  const [unit, setUnit] = useState<Unit>(() => getDefaultUnit(region));
  const chart = getChart(productType, unit);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const content = (
    <div className="flex flex-col h-full max-h-[85vh]">
      <div className="flex items-center justify-between pb-3 border-b border-black/10">
        <h3 className="font-serif text-lg font-bold text-charcoal">Size guide</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-2 -m-2 rounded-full hover:bg-black/5 text-black/60 hover:text-black"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>
      <div className="mt-3">
        <p className="text-xs font-extrabold uppercase tracking-widest text-black/45 mb-2">Units</p>
        <div className="inline-flex rounded-xl border border-black/10 p-0.5 bg-black/5" role="tablist">
          <button
            role="tab"
            aria-selected={unit === "imperial"}
            onClick={() => setUnit("imperial")}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-bold transition ${
              unit === "imperial" ? "bg-white text-black shadow-sm" : "text-black/60"
            }`}
          >
            Imperial
          </button>
          <button
            role="tab"
            aria-selected={unit === "metric"}
            onClick={() => setUnit("metric")}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-bold transition ${
              unit === "metric" ? "bg-white text-black shadow-sm" : "text-black/60"
            }`}
          >
            Metric
          </button>
        </div>
      </div>
      {/* Garment diagram */}
      <div className="mt-4 flex flex-col items-center">
        <GarmentDiagram productType={productType} />
        <p className="mt-1 text-[10px] text-black/40 text-center">
          Measurements are taken with the garment laid flat
        </p>
      </div>

      <div className="mt-4 flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full min-w-[320px] text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left py-2 pr-3 font-semibold text-black/70 w-28">Measure</th>
              {chart.sizes.map((size) => (
                <th key={size} className="py-2 px-1.5 text-center font-bold min-w-[40px] text-black/70">
                  {size}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((row) => (
              <tr key={row.key} className="border-t border-black/5">
                <td className="py-2 pr-3 font-medium text-black/70 text-left">{row.label}</td>
                {(chart.values[row.key] ?? []).map((val, idx) => (
                  <td key={`${row.key}-${idx}`} className="py-2 px-1.5 text-center text-black/80">
                    {val}
                    <span className="text-[10px] text-black/45 ml-0.5">{getUnitLabel(unit)}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-black/50 font-medium">
        Measurements refer to product dimensions.
      </p>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] flex items-end md:items-center justify-center p-0 md:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/35"
          onClick={onClose}
          aria-label="Close overlay"
        />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Size guide"
          className="relative w-full md:max-w-md md:rounded-2xl rounded-t-2xl border border-black/10 shadow-2xl p-5 max-h-[85vh] overflow-hidden flex flex-col"
          style={{ backgroundColor: "var(--color-cream)" }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
