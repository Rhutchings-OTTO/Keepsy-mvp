"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Wand2 } from "lucide-react";
import { applyVaultDesign } from "@/lib/store/createSession";

export type SavedDesign = {
  id: string;
  image_url: string;
  design_url: string | null;
  prompt: string | null;
  source_kind: "ai" | "original" | null;
  created_at: string;
};

export function SavedDesignsGrid({ initialDesigns }: { initialDesigns: SavedDesign[] }) {
  const router = useRouter();
  const [designs, setDesigns] = useState(initialDesigns);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function remove(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/account/designs?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Couldn't remove that design. Please try again.");
      setDesigns((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't remove that design.");
    } finally {
      setBusyId(null);
    }
  }

  function applyDesign(design: SavedDesign) {
    applyVaultDesign({
      imageUrl: design.design_url ?? design.image_url,
      designUrl: design.design_url,
      prompt: design.prompt ?? undefined,
    });
    router.push("/create");
  }

  if (designs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-charcoal/15 bg-[#FDF6EE] p-8 text-center">
        <p className="font-semibold text-charcoal">No saved designs yet</p>
        <p className="mt-1 text-sm text-charcoal/60">Designs you save while creating will appear here, ready to reuse on any product.</p>
      </div>
    );
  }

  return (
    <div>
      {error ? (
        <p role="alert" className="mb-3 rounded-xl px-4 py-3 text-sm font-semibold" style={{ backgroundColor: "rgba(196,113,74,0.10)", color: "var(--color-terra-dark)" }}>
          {error}
        </p>
      ) : null}
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {designs.map((d) => (
          <li key={d.id} className="overflow-hidden rounded-2xl border border-charcoal/8 bg-white shadow-[0_8px_24px_-12px_rgba(45,41,38,0.10)]">
            <div className="relative aspect-square bg-[#F5EDE0]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.design_url ?? d.image_url} alt={d.prompt ?? "Saved design"} className="h-full w-full object-cover" loading="lazy" />
              <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-charcoal/70">
                {d.source_kind === "original" ? "Your photo" : "AI design"}
              </span>
            </div>
            <div className="p-3">
              <p className="truncate text-xs text-charcoal/60" title={d.prompt ?? undefined}>
                {d.prompt || "Untitled design"}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyDesign(d)}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-bold text-white transition hover:opacity-90"
                  style={{ backgroundColor: "var(--color-terracotta)" }}
                >
                  <Wand2 size={14} /> Use on a gift
                </button>
                <button
                  type="button"
                  onClick={() => remove(d.id)}
                  disabled={busyId === d.id}
                  aria-label="Remove saved design"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-charcoal/10 text-charcoal/60 transition hover:bg-charcoal/5 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
