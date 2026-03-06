"use client";

import type { ConversionFlowState, RelationshipOption } from "@/context/ConversionFlowContext";

const RELATIONSHIPS: RelationshipOption[] = ["", "Mum", "Dad", "Partner", "Friend", "Grandparent", "Other"];
const OCCASIONS = ["", "Birthday", "Anniversary", "Thank you", "Mother's Day", "Father's Day", "Christmas", "Other"];
const MESSAGE_LIMIT = 220;

type GiftingStepProps = {
  value: ConversionFlowState;
  onChange: (patch: Partial<ConversionFlowState>) => void;
  onSkip: () => void;
  onReopen?: () => void;
  hidden: boolean;
};

const inputCls = "mt-1 w-full rounded-xl border border-black/12 bg-white/90 px-3 py-2 text-sm text-charcoal placeholder:text-charcoal/35 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-transparent";
const labelCls = "block text-xs font-medium text-charcoal/65";

export default function GiftingStep({ value, onChange, onSkip, onReopen, hidden }: GiftingStepProps) {
  if (hidden) {
    return (
      <section
        className="rounded-[1.5rem] border border-white/65 p-4 shadow-warm-sm backdrop-blur-sm"
        style={{ backgroundColor: "rgba(253,246,238,0.88)" }}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-charcoal/65">Personalised gifting is skipped.</p>
          <button
            type="button"
            onClick={() => onReopen?.()}
            className="rounded-full border border-black/12 bg-white/80 px-3 py-1 text-xs font-semibold text-charcoal transition hover:border-terracotta/40 hover:bg-white"
          >
            Reopen
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      className="rounded-[1.5rem] border border-white/65 p-5 shadow-warm-sm backdrop-blur-sm"
      style={{ backgroundColor: "rgba(253,246,238,0.88)" }}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-charcoal">Optional gifting details</p>
        <button
          type="button"
          onClick={onSkip}
          className="rounded-full border border-black/12 bg-white/80 px-3 py-1 text-xs font-semibold text-charcoal/70 transition hover:border-terracotta/40 hover:text-charcoal"
        >
          Skip
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelCls}>
          Recipient name (optional)
          <input
            value={value.recipientName}
            onChange={(e) => onChange({ recipientName: e.target.value })}
            className={inputCls}
            placeholder="e.g. Mum"
          />
        </label>

        <label className={labelCls}>
          Relationship
          <select
            value={value.relationship}
            onChange={(e) => onChange({ relationship: e.target.value as RelationshipOption })}
            className={inputCls}
          >
            {RELATIONSHIPS.map((option) => (
              <option key={option || "none"} value={option}>
                {option || "Select"}
              </option>
            ))}
          </select>
        </label>

        <label className={labelCls}>
          Occasion
          <select
            value={value.occasion}
            onChange={(e) => onChange({ occasion: e.target.value })}
            className={inputCls}
          >
            {OCCASIONS.map((option) => (
              <option key={option || "none"} value={option}>
                {option || "Select"}
              </option>
            ))}
          </select>
        </label>

        <label className={labelCls}>
          Delivery date (optional)
          <input
            type="date"
            value={value.deliveryDate}
            onChange={(e) => onChange({ deliveryDate: e.target.value })}
            className={inputCls}
          />
        </label>
      </div>

      <label className={`mt-3 ${labelCls}`}>
        Gift message
        <textarea
          value={value.giftMessage}
          onChange={(e) => onChange({ giftMessage: e.target.value.slice(0, MESSAGE_LIMIT) })}
          className={`${inputCls} h-20 resize-none`}
          placeholder="Add a short note..."
        />
      </label>
      <p className="mt-1 text-right text-[11px] text-charcoal/40">
        {value.giftMessage.length}/{MESSAGE_LIMIT}
      </p>

      <label className="mt-3 flex items-center gap-2 text-xs font-medium text-charcoal/65">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-black/20 accent-terracotta"
          checked={value.includeGiftMessage}
          onChange={(e) => onChange({ includeGiftMessage: e.target.checked })}
        />
        Include message in package
      </label>
    </section>
  );
}
