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

export default function GiftingStep({ value, onChange, onSkip, onReopen, hidden }: GiftingStepProps) {
  if (hidden) {
    return (
      <section className="rounded-2xl border border-[#E7DBCF] bg-white/80 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-[#5E4A38]">Personalised gifting is skipped.</p>
          <button
            type="button"
            onClick={() => onReopen?.()}
            className="rounded-full border border-[#DDCBB8] px-3 py-1 text-xs font-semibold text-[#5D4938]"
          >
            Reopen
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[#E7DBCF] bg-white/85 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[#4E3C2E]">Optional gifting details</p>
        <button
          type="button"
          onClick={onSkip}
          className="rounded-full border border-[#DDCCBC] px-3 py-1 text-xs font-semibold text-[#6A5644]"
        >
          Skip
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-[#7A6755]">
          Recipient name (optional)
          <input
            value={value.recipientName}
            onChange={(e) => onChange({ recipientName: e.target.value })}
            className="mt-1 w-full rounded-xl border border-[#E4D5C6] bg-white px-3 py-2 text-sm text-[#3E3024]"
            placeholder="e.g. Mum"
          />
        </label>

        <label className="text-xs text-[#7A6755]">
          Relationship
          <select
            value={value.relationship}
            onChange={(e) => onChange({ relationship: e.target.value as RelationshipOption })}
            className="mt-1 w-full rounded-xl border border-[#E4D5C6] bg-white px-3 py-2 text-sm text-[#3E3024]"
          >
            {RELATIONSHIPS.map((option) => (
              <option key={option || "none"} value={option}>
                {option || "Select"}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-[#7A6755]">
          Occasion
          <select
            value={value.occasion}
            onChange={(e) => onChange({ occasion: e.target.value })}
            className="mt-1 w-full rounded-xl border border-[#E4D5C6] bg-white px-3 py-2 text-sm text-[#3E3024]"
          >
            {OCCASIONS.map((option) => (
              <option key={option || "none"} value={option}>
                {option || "Select"}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-[#7A6755]">
          Delivery date (optional)
          <input
            type="date"
            value={value.deliveryDate}
            onChange={(e) => onChange({ deliveryDate: e.target.value })}
            className="mt-1 w-full rounded-xl border border-[#E4D5C6] bg-white px-3 py-2 text-sm text-[#3E3024]"
          />
        </label>
      </div>

      <label className="mt-3 block text-xs text-[#7A6755]">
        Gift message
        <textarea
          value={value.giftMessage}
          onChange={(e) => onChange({ giftMessage: e.target.value.slice(0, MESSAGE_LIMIT) })}
          className="mt-1 h-20 w-full rounded-xl border border-[#E4D5C6] bg-white px-3 py-2 text-sm text-[#3E3024]"
          placeholder="Add a short note..."
        />
      </label>
      <p className="mt-1 text-right text-[11px] text-[#8A7561]">
        {value.giftMessage.length}/{MESSAGE_LIMIT}
      </p>

      <label className="mt-2 flex items-center gap-2 text-xs text-[#6B5846]">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-[#D7C5B4]"
          checked={value.includeGiftMessage}
          onChange={(e) => onChange({ includeGiftMessage: e.target.checked })}
        />
        Include message in package (Gift message saved for your order)
      </label>
    </section>
  );
}

