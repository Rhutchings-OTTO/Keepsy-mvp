"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, ChevronRight, ChevronLeft } from "lucide-react";
import {
  getDesignVault,
  subscribeDesignVault,
  type DesignVaultEntry,
} from "@/lib/store/designVault";

type DesignVaultSidebarProps = {
  currentImageUrl: string | null;
  onSelectDesign: (entry: DesignVaultEntry) => void;
  className?: string;
};

export function DesignVaultSidebar({
  currentImageUrl,
  onSelectDesign,
  className = "",
}: DesignVaultSidebarProps) {
  const [entries, setEntries] = useState<DesignVaultEntry[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setEntries(getDesignVault());
    const unsub = subscribeDesignVault(() => setEntries(getDesignVault()));
    return unsub;
  }, []);

  if (entries.length === 0) return null;

  return (
    <div
      className={`flex flex-col border-r border-charcoal/10 rounded-l-2xl overflow-hidden transition-all ${className}`}
      style={{ backgroundColor: "rgba(253,246,238,0.7)", width: collapsed ? 48 : 140 }}
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center justify-between px-3 py-2.5 border-b border-charcoal/5 hover:bg-charcoal/5 transition-colors"
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2 min-w-0">
          <FolderOpen size={18} className="shrink-0 text-charcoal/60" />
          {!collapsed && (
            <span className="text-xs font-bold truncate">Design Vault</span>
          )}
        </div>
        {collapsed ? (
          <ChevronRight size={16} className="shrink-0 text-charcoal/40" />
        ) : (
          <ChevronLeft size={16} className="shrink-0 text-charcoal/40" />
        )}
      </button>

      <div className="flex-1 overflow-y-auto p-2 min-h-0">
        <AnimatePresence mode="popLayout">
          {entries.map((entry, i) => {
            const isActive = currentImageUrl === entry.imageUrl || 
              (entry.designUrl && currentImageUrl === entry.designUrl);
            return (
              <motion.button
                key={entry.id}
                type="button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onSelectDesign(entry)}
                className={`w-full aspect-square rounded-xl overflow-hidden border-2 transition-all mb-2 last:mb-0 focus:outline-none focus:ring-2 focus:ring-charcoal/20 ${
                  isActive
                    ? "border-charcoal ring-2 ring-charcoal/10"
                    : "border-charcoal/10 hover:border-charcoal/30"
                }`}
                title={entry.prompt ? entry.prompt.slice(0, 60) + "…" : "Previous design"}
              >
                <img
                  src={entry.designUrl || entry.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {!collapsed && (
        <p className="text-[10px] text-charcoal/40 px-2 py-1.5 border-t border-charcoal/5">
          Click to re-skin
        </p>
      )}
    </div>
  );
}
