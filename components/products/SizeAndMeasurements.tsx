"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  TSHIRT_IMPERIAL,
  TSHIRT_METRIC,
  HOODIE_IMPERIAL,
  HOODIE_METRIC,
  type SizeChartData,
  type SizeLabel,
} from "@/content/sizeCharts";
import type { Region } from "@/lib/region";

const STORAGE_KEY_PREFIX = "keepsy_size_";

type Unit = "imperial" | "metric";

export type SizeAndMeasurementsProps = {
  productType: "tshirt" | "hoodie";
  region: Region;
  initialSize?: string;
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

function persistSize(productType: "tshirt" | "hoodie", size: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${productType}`, size);
  } catch {
    // ignore
  }
}

function loadSize(productType: "tshirt" | "hoodie"): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${productType}`);
  } catch {
    return null;
  }
}

export function SizeAndMeasurements({
  productType,
  region,
  initialSize = "M",
}: SizeAndMeasurementsProps) {
  const [expanded, setExpanded] = useState(false);
  const [unit, setUnit] = useState<Unit>(() => getDefaultUnit(region));
  const [selectedSize, setSelectedSize] = useState<string>(() => {
    const stored = loadSize(productType);
    const chart = getChart(productType, getDefaultUnit(region));
    if (stored && chart.sizes.includes(stored as SizeLabel)) return stored;
    return initialSize;
  });

  const chart = getChart(productType, unit);
  const selectedIndex = chart.sizes.indexOf(selectedSize as SizeLabel);
  const validSelectedIndex = selectedIndex >= 0 ? selectedIndex : chart.sizes.indexOf("M");

  useEffect(() => {
    if (chart.sizes.includes(selectedSize as SizeLabel)) return;
    const timer = setTimeout(() => setSelectedSize("M"), 0);
    return () => clearTimeout(timer);
  }, [chart.sizes, selectedSize]);

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    persistSize(productType, size);
  };

  return (
    <div className="rounded-2xl border border-black/10 shadow-sm overflow-hidden" style={{ backgroundColor: "rgba(253,246,238,0.92)" }}>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left min-h-[52px] focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2 rounded-2xl"
        aria-expanded={expanded}
        aria-controls="size-measurements-panel"
        id="size-measurements-trigger"
      >
        <span className="font-bold text-charcoal">Size & measurements</span>
        {expanded ? (
          <ChevronUp size={20} className="text-black/50 shrink-0" aria-hidden />
        ) : (
          <ChevronDown size={20} className="text-black/50 shrink-0" aria-hidden />
        )}
      </button>

      <div
        id="size-measurements-panel"
        role="region"
        aria-labelledby="size-measurements-trigger"
        className={`overflow-hidden transition-all duration-200 ${expanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="px-4 pb-4 pt-0 space-y-4 border-t border-black/5">
          {/* Size selector */}
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-black/45 mb-2">Size</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Select size">
              {chart.sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleSizeSelect(size)}
                  className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl text-sm font-bold transition ${
                    selectedSize === size
                      ? "text-white"
                      : "bg-black/5 text-charcoal/80 hover:bg-black/10"
                  }`}
                  style={selectedSize === size ? { backgroundColor: "var(--color-charcoal)" } : undefined}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Imperial / Metric tabs */}
          <div>
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

          {/* Measurement table */}
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full min-w-[360px] text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-2 pr-3 font-semibold text-black/70 w-24">Measure</th>
                  {chart.sizes.map((size, idx) => (
                    <th
                      key={size}
                      className={`py-2 px-2 text-center font-bold min-w-[48px] ${
                        idx === validSelectedIndex ? "bg-black/8 text-black" : "text-black/60"
                      }`}
                    >
                      {size}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chart.rows.map((row) => (
                  <tr key={row.key} className="border-t border-black/5">
                    <td className="py-2 pr-3 font-medium text-black/70">{row.label}</td>
                    {(chart.values[row.key] ?? []).map((val, idx) => (
                      <td
                        key={`${row.key}-${idx}`}
                        className={`py-2 px-2 text-center ${
                          idx === validSelectedIndex ? "bg-black/8 font-semibold text-black" : "text-black/70"
                        }`}
                      >
                        {val}
                        <span className="text-[10px] text-black/45 ml-0.5">{getUnitLabel(unit)}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-black/50 font-medium">
            Measurements refer to product dimensions.
          </p>
        </div>
      </div>
    </div>
  );
}
