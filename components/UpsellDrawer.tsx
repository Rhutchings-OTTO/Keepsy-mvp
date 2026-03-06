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
            className="fixed inset-x-0 bottom-0 z-[71] rounded-t-[2rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,242,236,0.96))] p-5 shadow-[0_-24px_60px_-34px_rgba(0,0,0,0.42)] backdrop-blur-xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 180, damping: 24 }}
          >
            <p className="text-sm font-semibold text-[#4E3C2E]">Optional add-ons</p>
            <p className="mt-1 text-xs text-[#7B6654]">Saved as Add-ons (coming next). Checkout still works as usual.</p>
            <div className="mt-4 space-y-2">
              {OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-center justify-between rounded-[1.15rem] border border-white/65 bg-white/82 px-3 py-2 shadow-[0_10px_24px_-22px_rgba(0,0,0,0.18)]"
                >
                  <div>
                    <p className="text-sm text-[#594736]">{option.label}</p>
                    <p className="text-xs text-[#8A7561]">{option.priceHint}</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[#D6C5B5]"
                    checked={selectedUpsells.includes(option.id)}
                    onChange={() => toggleUpsell(option.id)}
                  />
                </label>
              ))}
            </div>

            <div className="mt-3 rounded-[1.15rem] border border-white/65 bg-[#FBF7F2] p-3">
              <p className="text-xs font-semibold text-[#5D4938]">Bundle option</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {["none", "gift-bundle", "premium-bundle"].map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => onChange({ bundleChoice: choice })}
                    className={`rounded-full px-3 py-1 text-xs ${
                      bundleChoice === choice
                        ? "bg-[#5B4330] text-white"
                        : "border border-[#D9C9B8] bg-white text-[#644F3D]"
                    }`}
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
                className="rounded-full border border-[#DCCABA] px-4 py-2 text-sm font-semibold text-[#5F4B39]"
              >
                No thanks
              </button>
              <button
                type="button"
                onClick={onContinue}
                className="rounded-full bg-[#4E3827] px-4 py-2 text-sm font-semibold text-white"
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
