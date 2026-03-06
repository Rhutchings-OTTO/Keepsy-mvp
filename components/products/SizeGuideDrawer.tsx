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
