"use client";

import { useState, memo } from "react";
import { ChevronDown, Check } from "lucide-react";
import {
  CANVAS_BY_ORIENTATION,
  TIER_LABEL,
  type CanvasOrientation,
  type CanvasSize,
  type CanvasTier,
} from "@/lib/canvas/sizes";

type Props = {
  selected: CanvasSize;
  onChange: (size: CanvasSize) => void;
  formatPrice: (n: number) => string;
};

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

const TIER_ORDER: CanvasTier[] = ["small", "medium", "large", "xlarge"];
const ORIENTATIONS: CanvasOrientation[] = ["Horizontal", "Vertical", "Square"];

function AspectThumb({ w, h }: { w: number; h: number }) {
  const max = 28;
  const ratio = w / h;
  const thumbW = ratio >= 1 ? max : Math.round(max * ratio);
  const thumbH = ratio <= 1 ? max : Math.round(max / ratio);
  return (
    <div
      aria-hidden
      style={{ width: thumbW, height: thumbH }}
      className="rounded-[2px] border border-charcoal/20 bg-charcoal/8 shrink-0"
    />
  );
}

export const CanvasSizeSelector = memo(function CanvasSizeSelector({
  selected,
  onChange,
  formatPrice,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<CanvasOrientation>(selected.orientation);

  const sizesByTier = (orientation: CanvasOrientation): Record<CanvasTier, CanvasSize[]> => {
    const result: Record<CanvasTier, CanvasSize[]> = { small: [], medium: [], large: [], xlarge: [] };
    for (const s of CANVAS_BY_ORIENTATION[orientation]) {
      result[s.tier].push(s);
    }
    return result;
  };

  const handleSelect = (size: CanvasSize) => {
    onChange(size);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Collapsed trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-charcoal/15 bg-white px-4 py-3 text-left transition hover:border-charcoal/30 focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <AspectThumb w={selected.width} h={selected.height} />
          <div>
            <span className="text-sm font-bold text-charcoal">
              {selected.width} × {selected.height} in
            </span>
            <span className="ml-2 text-xs text-charcoal/50 font-semibold">
              {selected.orientation}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-black">{formatPrice(selected.priceGBP)}</span>
          <ChevronDown
            size={16}
            className={`text-charcoal/40 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Expanded panel */}
      {isOpen && (
        <div className="mt-2 rounded-2xl border border-charcoal/10 bg-white shadow-[0_16px_40px_-20px_rgba(45,41,38,0.20)] overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-charcoal/8">
            {ORIENTATIONS.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setActiveTab(o)}
                className={`flex-1 px-3 py-3 text-xs font-bold transition ${
                  activeTab === o
                    ? "border-b-2 border-terracotta text-terracotta"
                    : "text-charcoal/50 hover:text-charcoal"
                }`}
              >
                {o}
              </button>
            ))}
          </div>

          {/* Size grid */}
          <div className="max-h-72 overflow-y-auto p-3 space-y-3">
            {TIER_ORDER.map((tier) => {
              const sizes = sizesByTier(activeTab)[tier];
              if (!sizes.length) return null;
              return (
                <div key={tier}>
                  <p className="mb-1.5 px-1 text-[10px] font-extrabold uppercase tracking-widest text-charcoal/35">
                    {TIER_LABEL[tier]} — {GBP.format(sizes[0].priceGBP)}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {sizes.map((size) => {
                      const isSelected = size.code === selected.code;
                      return (
                        <button
                          key={size.code}
                          type="button"
                          onClick={() => handleSelect(size)}
                          className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition ${
                            isSelected
                              ? "border-terracotta bg-terracotta/5"
                              : "border-charcoal/10 hover:border-charcoal/25 hover:bg-[#F5EDE0]"
                          }`}
                        >
                          <AspectThumb w={size.width} h={size.height} />
                          <span className={`text-xs font-bold ${isSelected ? "text-terracotta" : "text-charcoal"}`}>
                            {size.width}×{size.height}
                          </span>
                          {isSelected && <Check size={12} className="ml-auto text-terracotta shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
