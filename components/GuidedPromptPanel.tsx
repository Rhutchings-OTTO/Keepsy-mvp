"use client";

import { useMemo, useState } from "react";
import { Wand2 } from "lucide-react";

const EXAMPLE_CHIPS = [
  "A golden retriever family portrait in watercolor",
  "Funny cartoon of a cat chef making pancakes",
  "Cozy cottage by the sea in vintage style",
  "Elegant floral initials on soft paper texture",
];

const SUBJECTS = ["Person", "Pet", "Family", "Home", "Couple", "Baby"];
const STYLES = ["Photorealistic", "Watercolor", "Cartoon", "Vintage", "Minimal"];
const MOODS = ["Warm", "Funny", "Elegant", "Cozy", "Playful"];
const BACKGROUNDS = ["Home", "Beach", "Studio", "Garden", "City"];

type GuidedPromptPanelProps = {
  currentPrompt: string;
  onApplyPrompt: (prompt: string) => void;
};

export default function GuidedPromptPanel({ currentPrompt, onApplyPrompt }: GuidedPromptPanelProps) {
  const [subject, setSubject] = useState("Person");
  const [style, setStyle] = useState("Watercolor");
  const [mood, setMood] = useState("Warm");
  const [background, setBackground] = useState("Home");
  const [giftReady, setGiftReady] = useState(true);

  const builtPrompt = useMemo(() => {
    const parts = [
      `${subject.toLowerCase()} keepsake artwork`,
      `${style.toLowerCase()} style`,
      `${mood.toLowerCase()} mood`,
      `${background.toLowerCase()} background`,
    ];
    if (giftReady) parts.push("tasteful and gift-ready composition");
    return parts.join(", ");
  }, [background, giftReady, mood, style, subject]);

  const improvePrompt = () => {
    const base = currentPrompt.trim() || builtPrompt;
    onApplyPrompt(
      `Create a high-quality print design: ${base}. Keep the subject clear, centered, and visually balanced with premium detail.`,
    );
  };

  return (
    <section className="rounded-2xl border border-charcoal/8 bg-white p-4 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.12)] sm:p-5">
      <div className="mb-3 flex items-center gap-2 text-charcoal">
        <Wand2 className="h-4 w-4" />
        <p className="text-sm font-semibold">Guided prompt builder</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-charcoal/55">
          Who or what is it?
          <select
            className="mt-1 w-full rounded-xl border border-black/12 bg-white/90 px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            {SUBJECTS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-charcoal/55">
          Style
          <select
            className="mt-1 w-full rounded-xl border border-black/12 bg-white/90 px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          >
            {STYLES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-charcoal/55">
          Mood
          <select
            className="mt-1 w-full rounded-xl border border-black/12 bg-white/90 px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
          >
            {MOODS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-charcoal/55">
          Background
          <select
            className="mt-1 w-full rounded-xl border border-black/12 bg-white/90 px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
          >
            {BACKGROUNDS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-3 flex items-center gap-2 text-xs text-charcoal/65">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-black/20 accent-terracotta"
          checked={giftReady}
          onChange={(e) => setGiftReady(e.target.checked)}
        />
        Make it gift-ready
      </label>

      <div className="mt-4 rounded-xl bg-cream/80 p-3 text-xs text-charcoal/70">{builtPrompt}</div>

      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLE_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => onApplyPrompt(chip)}
            className="rounded-full border border-charcoal/15 bg-white/80 px-3 py-1 text-xs text-charcoal transition hover:border-charcoal/25"
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onApplyPrompt(builtPrompt)}
          className="rounded-full bg-terracotta px-4 py-2 text-xs font-semibold text-white shadow-terra-glow transition hover:opacity-90"
        >
          Use this prompt
        </button>
        <button
          type="button"
          onClick={improvePrompt}
          className="rounded-full border border-charcoal/15 bg-white/80 px-4 py-2 text-xs font-semibold text-charcoal transition hover:bg-white"
        >
          Make it better
        </button>
      </div>
    </section>
  );
}

