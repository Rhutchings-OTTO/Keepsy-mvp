"use client";
import { useState } from "react";
import type { CartLine } from "@/lib/cart/store";
import { linePrice } from "@/lib/cart/store";
import type { CheckoutOptions } from "@/lib/cart/checkoutClient";
import { useDestination } from "@/lib/hooks/useDestination";
import { getCountry } from "@/lib/commerce/markets";
import {
  MARKETING_CONSENT_TEXT,
  CURRENT_CHECKOUT_CONSENT_VERSION,
} from "@/lib/crm/consentText";
import { DestinationButton } from "@/components/DestinationSelector";
export type CheckoutPreferencesValue = {
  code: string;
  email: string;
  marketing: boolean;
};
export const EMPTY_CHECKOUT_PREFERENCES: CheckoutPreferencesValue = {
  code: "",
  email: "",
  marketing: false,
};
export function checkoutOptions(
  value: CheckoutPreferencesValue,
  country: string | null,
): CheckoutOptions {
  if (!country) throw new Error("Choose your delivery country first.");
  if (value.code && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email))
    throw new Error(
      "Enter the email address that received your discount code.",
    );
  return {
    destinationCountry: country,
    discount: value.code ? { code: value.code, email: value.email } : null,
    marketing: {
      consent: value.marketing,
      textVersion: CURRENT_CHECKOUT_CONSENT_VERSION,
    },
  };
}
export function CheckoutPreferences({
  value,
  onChange,
  lines,
}: {
  value: CheckoutPreferencesValue;
  onChange: (v: CheckoutPreferencesValue) => void;
  lines: CartLine[];
}) {
  const destination = useDestination();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function check() {
    setBusy(true);
    setMessage("");
    try {
      const country = getCountry(destination);
      if (!country) throw new Error("Choose your delivery country first.");
      const r = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: value.code,
          email: value.email,
          destinationCountry: country.code,
          cart: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            unitPrice: linePrice(l, country.currency),
          })),
        }),
      });
      const d = await r.json();
      setMessage(
        d.ok
          ? d.percent +
              "% discount available. The final total is shown at secure checkout."
          : d.message || "This code couldn't be checked.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Try again shortly.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-5 border-t border-black/10 py-5">
      <div>
        <p className="mb-2 text-xs font-semibold">Delivery country</p>
        <DestinationButton />
      </div>
      <details className="rounded-2xl border border-black/10 p-4">
        <summary className="cursor-pointer text-sm font-semibold">
          Have a welcome code?
        </summary>
        <div className="mt-4 space-y-3">
          <label className="block text-xs">
            Code
            <input
              value={value.code}
              onChange={(e) => {
                onChange({ ...value, code: e.target.value.toUpperCase() });
                setMessage("");
              }}
              className="mt-1 w-full rounded-xl border border-black/15 p-3 text-sm"
              autoComplete="off"
              maxLength={40}
            />
          </label>
          <label className="block text-xs">
            Email that received your code
            <input
              type="email"
              autoComplete="email"
              value={value.email}
              onChange={(e) => {
                onChange({ ...value, email: e.target.value });
                setMessage("");
              }}
              className="mt-1 w-full rounded-xl border border-black/15 p-3 text-sm"
            />
          </label>
          <button
            type="button"
            disabled={busy || !value.code || !value.email}
            onClick={check}
            className="rounded-full border border-[#2C4A3E] px-4 py-2 text-sm disabled:opacity-50"
          >
            {busy ? "Checking…" : "Check code"}
          </button>
          {message && (
            <p role="status" className="text-xs leading-relaxed">
              {message}
            </p>
          )}
        </div>
      </details>
      <label className="flex gap-3 text-xs leading-relaxed text-black/65">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0"
          checked={value.marketing}
          onChange={(e) => onChange({ ...value, marketing: e.target.checked })}
        />
        {MARKETING_CONSENT_TEXT[CURRENT_CHECKOUT_CONSENT_VERSION]}
      </label>
    </section>
  );
}
