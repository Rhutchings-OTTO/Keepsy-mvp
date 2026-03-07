"use client";

import { motion, AnimatePresence } from "framer-motion";

const OPTIONS = [
  { id: "matching-card", label: "Add a matching card", priceHint: "+ small extra" },
  { id: "second-print", label: "Add a second print", priceHint: "+ small extra" },
  { id: "priority-print", label: "Priority print handling", priceHint: "optional add-on" },
];

type UpsellDrawerProps = {
  open: boolean;
  selectedUpsells: string[];
  bundleChoice: string;
  onChange: (patch: { selectedUpsells?: string[]; bundleChoice?: string }) => void;
  onNoThanks: () => void;
  onContinue: () => void;
};

export default function UpsellDrawer({
  open,
  selectedUpsells,
  bundleChoice,
  onChange,
  onNoThanks,
  onContinue,
}: UpsellDrawerProps) {
  const toggleUpsell = (id: string) => {
    const next = selectedUpsells.includes(id)
      ? selectedUpsells.filter((item) => item !== id)
      : [...selectedUpsells, id];
    onChange({ selectedUpsells: next });
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close add-ons"
            className="fixed inset-0 z-[70] bg-black/35"
            onClick={onNoThanks}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Optional add-ons"
            className="fixed inset-x-0 bottom-0 z-[71] rounded-t-2xl border border-charcoal/10 bg-white p-5 shadow-[0_-16px_40px_-20px_rgba(45,41,38,0.15)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 180, damping: 24 }}
          >
            <p className="text-sm font-semibold text-charcoal">Optional add-ons</p>
            <p className="mt-1 text-xs text-charcoal/60">Saved as Add-ons (coming next). Checkout still works as usual.</p>
            <div className="mt-4 space-y-2">
              {OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-center justify-between rounded-[1.15rem] border border-charcoal/10 bg-white/70 px-3 py-2 shadow-[0_10px_24px_-22px_rgba(45,41,38,0.18)]"
                >
                  <div>
                    <p className="text-sm text-charcoal">{option.label}</p>
                    <p className="text-xs text-charcoal/55">{option.priceHint}</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-charcoal/20"
                    checked={selectedUpsells.includes(option.id)}
                    onChange={() => toggleUpsell(option.id)}
                  />
                </label>
              ))}
            </div>

            <div className="mt-3 rounded-[1.15rem] border border-charcoal/10 p-3" style={{ backgroundColor: "rgba(253,246,238,0.8)" }}>
              <p className="text-xs font-semibold text-charcoal">Bundle option</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {["none", "gift-bundle", "premium-bundle"].map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => onChange({ bundleChoice: choice })}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition hover:opacity-90 ${
                      bundleChoice === choice
                        ? "text-white"
                        : "border border-charcoal/15 bg-white/60 text-charcoal/80"
                    }`}
                    style={bundleChoice === choice ? { backgroundColor: "var(--color-terracotta)" } : undefined}
                  >
                    {choice === "none" ? "No bundle" : choice === "gift-bundle" ? "Gift bundle" : "Premium bundle"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onNoThanks}
                className="rounded-full border border-charcoal/15 px-4 py-2 text-sm font-semibold text-charcoal/80"
              >
                No thanks
              </button>
              <button
                type="button"
                onClick={onContinue}
                className="rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: "var(--color-terracotta)" }}
              >
                Continue to checkout
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
