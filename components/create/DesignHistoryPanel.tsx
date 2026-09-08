"use client";

import React from "react";
import { History, Image as ImageIcon, Sparkles, Wand2, Check } from "lucide-react";
import type { DesignNode } from "@/lib/store/createSession";

type Props = {
  nodes: DesignNode[];
  currentNodeId: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
  className?: string;
};

function depthOf(nodes: DesignNode[], id: string): number {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let depth = 0;
  let cursor = byId.get(id);
  while (cursor?.parentId && byId.has(cursor.parentId)) {
    depth += 1;
    cursor = byId.get(cursor.parentId);
  }
  return depth;
}

/** Depth-first order so refinements sit under the image they came from. */
export function orderForDisplay(nodes: DesignNode[]): DesignNode[] {
  const children = new Map<string | null, DesignNode[]>();
  for (const n of nodes) {
    const key = n.parentId && nodes.some((p) => p.id === n.parentId) ? n.parentId : null;
    children.set(key, [...(children.get(key) ?? []), n]);
  }
  const out: DesignNode[] = [];
  const visit = (parent: string | null) => {
    for (const n of (children.get(parent) ?? []).sort((a, b) => a.createdAt - b.createdAt)) {
      out.push(n);
      visit(n.id);
    }
  };
  visit(null);
  return out;
}

const KIND_META: Record<DesignNode["kind"], { label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  generation: { label: "AI design", Icon: Sparkles },
  refinement: { label: "Edit", Icon: Wand2 },
  original: { label: "Your photo", Icon: ImageIcon },
};

/**
 * Left-hand iteration history. Every generation/edit/photo in this session is
 * listed; edits are indented under the image they were made from. Clicking an
 * entry makes it the current design — previews, basket and future edits all
 * use that exact image.
 */
export function DesignHistoryPanel({ nodes, currentNodeId, onSelect, disabled = false, className = "" }: Props) {
  if (nodes.length === 0) return null;
  const ordered = orderForDisplay(nodes);

  const renderThumb = (node: DesignNode, variant: "row" | "chip") => {
    const isActive = node.id === currentNodeId;
    const depth = depthOf(nodes, node.id);
    const meta = KIND_META[node.kind];
    const number = ordered.indexOf(node) + 1;
    const common = `relative overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-terracotta/30 disabled:opacity-60 ${
      isActive ? "border-terracotta ring-2 ring-terracotta/20" : "border-charcoal/10 hover:border-charcoal/35"
    }`;
    if (variant === "chip") {
      return (
        <button
          key={node.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(node.id)}
          aria-pressed={isActive}
          aria-label={`${meta.label} ${number}${isActive ? " (current)" : ""}`}
          title={node.prompt.slice(0, 80)}
          className={`${common} h-14 w-14 flex-shrink-0 rounded-xl`}
          data-history-node={node.id}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={node.imageUrl} alt="" className="h-full w-full object-cover" />
          <span className="absolute left-0.5 top-0.5 rounded-full bg-white/90 px-1 text-[9px] font-black text-charcoal">{number}</span>
          {isActive ? (
            <span className="absolute bottom-0.5 right-0.5 rounded-full bg-terracotta p-0.5 text-white">
              <Check size={10} />
            </span>
          ) : null}
        </button>
      );
    }
    return (
      <button
        key={node.id}
        type="button"
        disabled={disabled}
        onClick={() => onSelect(node.id)}
        aria-pressed={isActive}
        title={node.prompt.slice(0, 120)}
        className={`${common} mb-2 flex w-full items-center gap-2 rounded-xl bg-white p-1.5 text-left last:mb-0`}
        style={{ marginLeft: Math.min(depth, 3) * 10 }}
        data-history-node={node.id}
      >
        <span className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-[#F5EDE0]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={node.imageUrl} alt="" className="h-full w-full object-cover" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-charcoal/55">
            <meta.Icon size={11} /> {meta.label} {number}
          </span>
          <span className="mt-0.5 block truncate text-[11px] font-medium text-charcoal/75">
            {node.kind === "refinement" ? node.prompt.replace(/^Apply only this change to the image:\s*/i, "").split(". Preserve")[0] : node.prompt}
          </span>
          {isActive ? (
            <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold" style={{ color: "var(--color-terracotta)" }}>
              <Check size={10} /> Current
            </span>
          ) : null}
        </span>
      </button>
    );
  };

  return (
    <>
      {/* Mobile: horizontal strip */}
      <div
        className="flex items-center gap-2 overflow-x-auto rounded-xl border border-charcoal/8 px-2 py-1.5 md:hidden"
        style={{ backgroundColor: "rgba(253,246,238,0.85)" }}
        aria-label="Design history"
      >
        <div className="flex flex-shrink-0 items-center gap-1.5 border-r border-charcoal/10 pr-2">
          <History size={14} className="text-charcoal/50" />
          <span className="whitespace-nowrap text-[10px] font-bold text-charcoal/50">History</span>
        </div>
        {ordered.map((n) => renderThumb(n, "chip"))}
      </div>

      {/* Desktop: vertical panel */}
      <aside
        className={`hidden w-[188px] flex-shrink-0 flex-col overflow-hidden rounded-l-2xl border-r border-charcoal/10 md:flex ${className}`}
        style={{ backgroundColor: "rgba(253,246,238,0.85)" }}
        aria-label="Design history"
      >
        <div className="flex items-center gap-2 border-b border-charcoal/5 px-3 py-2.5">
          <History size={16} className="text-charcoal/60" />
          <span className="text-xs font-bold text-charcoal">History</span>
          <span className="ml-auto text-[10px] font-semibold text-charcoal/45">{ordered.length}</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">{ordered.map((n) => renderThumb(n, "row"))}</div>
        <p className="border-t border-charcoal/5 px-3 py-2 text-[10px] leading-snug text-charcoal/50">
          Pick any earlier image to keep editing from it. Edits sit under the image they came from.
        </p>
      </aside>
    </>
  );
}
