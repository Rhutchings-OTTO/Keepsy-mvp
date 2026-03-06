"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircleHeart } from "lucide-react";

type AssistantMessage = {
  role: "user" | "assistant";
  text: string;
};

const STORAGE_KEY = "keepsy-gift-assistant-v1";
const SUGGESTIONS = ["Help me write a prompt", "What gift should I choose?", "Make it funny but tasteful"];

function buildAssistantResponse(input: string) {
  const lower = input.toLowerCase();
  if (lower.includes("mum") && lower.includes("cat")) {
    return [
      "Try these prompt ideas:",
      "1) Warm watercolor portrait of Mum cuddling her cat by a sunny window.",
      "2) Elegant illustrated keepsake of Mum and her cat with floral accents.",
      "3) Funny but tasteful cartoon of Mum and cat sharing tea in a cozy kitchen.",
      "Best product fit: a card for sentiment or a mug for everyday smiles.",
    ].join("\n");
  }

  if (lower.includes("funny")) {
    return [
      "A playful prompt that stays tasteful:",
      '"Create a charming cartoon scene with gentle humor, expressive characters, and clean composition suitable for a gift print."',
      "Best product fit: tee or mug for playful designs.",
    ].join("\n");
  }

  if (lower.includes("gift") || lower.includes("choose")) {
    return [
      "Quick gift guide:",
      "- Card: sentimental and personal",
      "- Mug: practical daily keepsake",
      "- Tee/Hoodie: bold visual statement",
      "If you want, tell me recipient + vibe and I will draft 3 prompts.",
    ].join("\n");
  }

  return [
    "Here is a strong prompt starter:",
    '"Create a premium gift-ready artwork with clear subject focus, warm lighting, and balanced composition for print."',
    "Share recipient + style and I can tailor it.",
  ].join("\n");
}

export default function GiftAssistantWidget({ onApplyPrompt }: { onApplyPrompt: (prompt: string) => void }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>(() => {
    if (typeof window === "undefined") {
      return [{ role: "assistant", text: "Hi, I am Keepsy's AI gift assistant. Tell me who this gift is for and your style." }];
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [{ role: "assistant", text: "Hi, I am Keepsy's AI gift assistant. Tell me who this gift is for and your style." }];
    }
    try {
      const parsed = JSON.parse(raw) as AssistantMessage[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(-8);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    return [{ role: "assistant", text: "Hi, I am Keepsy's AI gift assistant. Tell me who this gift is for and your style." }];
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-8)));
  }, [messages]);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  const send = (nextInput?: string) => {
    const text = (nextInput ?? input).trim();
    if (!text) return;
    const reply = buildAssistantResponse(text);
    setMessages((prev) => {
      const next: AssistantMessage[] = [...prev, { role: "user", text }, { role: "assistant", text: reply }];
      return next.slice(-8);
    });
    setInput("");
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open ? (
        <div
          className="w-[min(92vw,360px)] rounded-2xl border border-black/10 p-3 shadow-xl"
          style={{ backgroundColor: "var(--color-cream)" }}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-charcoal">AI Gift Assistant</p>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-charcoal/60">
              Close
            </button>
          </div>
          <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
            {messages.map((message, idx) => (
              <div
                key={`${message.role}-${idx}`}
                className={`rounded-xl px-3 py-2 text-xs whitespace-pre-line text-charcoal ${
                  message.role === "assistant" ? "bg-black/5" : "bg-black/10"
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => send(suggestion)}
                className="rounded-full border border-black/15 px-2 py-1 text-[11px] text-charcoal/70"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div className="mt-2 space-y-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. mum + cat + cozy"
              className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm text-charcoal bg-white/60"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!canSend}
                onClick={() => send()}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: "var(--color-terracotta)" }}
              >
                Send
              </button>
              <button
                type="button"
                onClick={() => {
                  const lastAssistant = [...messages].reverse().find((message) => message.role === "assistant");
                  if (lastAssistant) onApplyPrompt(lastAssistant.text.split("\n")[1] ?? lastAssistant.text);
                }}
                className="rounded-full border border-black/15 px-3 py-1.5 text-xs font-semibold text-charcoal/80"
              >
                Use suggestion
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full border border-black/15 px-3 py-2 text-sm text-charcoal shadow-lg"
          style={{ backgroundColor: "var(--color-cream)" }}
        >
          <MessageCircleHeart className="h-4 w-4" aria-hidden="true" />
          AI gift assistant
        </button>
      )}
    </div>
  );
}

