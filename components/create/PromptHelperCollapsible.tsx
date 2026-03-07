"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const WHO_OPTIONS = ["Person", "Pet", "Family", "Home", "Couple", "Baby"];
const STYLE_OPTIONS = ["Photorealistic", "Watercolor", "Cartoon", "Vintage", "Minimal"];
const MOOD_OPTIONS = ["Warm", "Funny", "Elegant", "Cozy", "Playful"];
const BG_OPTIONS = ["Home", "Beach", "Studio", "Garden", "City"];

type Props = {
  onUsePrompt: (prompt: string) => void;
};

export function PromptHelperCollapsible({ onUsePrompt }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [who, setWho] = useState("Person");
  const [style, setStyle] = useState("Watercolor");
  const [mood, setMood] = useState("Warm");
  const [background, setBackground] = useState("Home");

  const builtPrompt = useMemo(
    () =>
      [
        `${who.toLowerCase()} keepsake artwork`,
        `${style.toLowerCase()} style`,
        `${mood.toLowerCase()} mood`,
        `${background.toLowerCase()} background`,
        "tasteful and gift-ready composition",
      ].join(", "),
    [who, style, mood, background]
  );

  return (
    <section className="mt-5 w-full rounded-2xl border border-charcoal/8 bg-white p-4 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.12)]">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between py-1 text-left"
        aria-expanded={expanded}
      >
        <span className="text-sm font-semibold text-charcoal/75">Need help writing it?</span>
        {expanded ? <ChevronUp size={18} className="text-charcoal/50" /> : <ChevronDown size={18} className="text-charcoal/50" />}
      </button>
      {expanded && (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-charcoal/55">Who or what?</span>
              <select
                value={who}
                onChange={(e) => setWho(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/12 bg-white/90 px-3 py-2.5 text-sm font-medium text-charcoal focus:outline-none focus:ring-2 focus:ring-terracotta/30"
              >
                {WHO_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-charcoal/55">Style</span>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/12 bg-white/90 px-3 py-2.5 text-sm font-medium text-charcoal focus:outline-none focus:ring-2 focus:ring-terracotta/30"
              >
                {STYLE_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-charcoal/55">Mood</span>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/12 bg-white/90 px-3 py-2.5 text-sm font-medium text-charcoal focus:outline-none focus:ring-2 focus:ring-terracotta/30"
              >
                {MOOD_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-charcoal/55">Background</span>
              <select
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/12 bg-white/90 px-3 py-2.5 text-sm font-medium text-charcoal focus:outline-none focus:ring-2 focus:ring-terracotta/30"
              >
                {BG_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="button"
            onClick={() => onUsePrompt(builtPrompt)}
            className="w-full rounded-full bg-terracotta px-4 py-3 text-sm font-bold text-white shadow-terra-glow transition hover:opacity-90"
          >
            Use this prompt
          </button>
        </div>
      )}
    </section>
  );
}
