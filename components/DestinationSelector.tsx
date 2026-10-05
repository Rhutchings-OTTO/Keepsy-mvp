"use client";

/**
 * Delivery destination UI.
 *
 * - `DestinationSelector` — a small dialog listing the countries we deliver to
 *   today, followed by a greyed "Coming soon" group so nobody assumes worldwide
 *   shipping. Never blocks the page.
 * - `DestinationButton` — the header control ("Deliver to: United Kingdom").
 * - `DestinationSuggestionStrip` — a slim, dismissible strip shown when there is
 *   no destination cookie yet. The suggestion comes from request headers via
 *   the server (`suggestCountryFromHeaders`). The cookie is only written when
 *   the customer confirms.
 *
 * Source of truth: lib/commerce/markets.ts + lib/hooks/useDestination.ts.
 */

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, X } from "lucide-react";
import {
  SHIP_COUNTRIES,
  enabledCountries,
  getCountry,
  type CountryCode,
} from "@/lib/commerce/markets";
import { setDestination, useDestination } from "@/lib/hooks/useDestination";

/** UI default when nothing is chosen yet. The business is UK-based. */
export const DEFAULT_DESTINATION: CountryCode = "GB";

/** Destination the UI should render for (chosen country, else GB). */
export function useDisplayDestination(): CountryCode {
  const chosen = useDestination();
  return chosen && getCountry(chosen) ? chosen : DEFAULT_DESTINATION;
}

function currencyLabel(currency: "gbp" | "usd"): string {
  return currency === "usd" ? "USD $" : "GBP £";
}

/* ─── Dialog ─────────────────────────────────────────────────────────────── */

export type DestinationSelectorProps = {
  open: boolean;
  onClose: () => void;
  /** Called after the destination cookie has been written. */
  onSelect?: (code: CountryCode) => void;
};

export function DestinationSelector({
  open,
  onClose,
  onSelect,
}: DestinationSelectorProps) {
  const current = useDisplayDestination();
  const titleId = useId();
  const firstRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => firstRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const enabled = enabledCountries();
  const comingSoon = SHIP_COUNTRIES.filter((c) => !c.enabled);

  const choose = (code: CountryCode) => {
    setDestination(code);
    onSelect?.(code);
    onClose();
  };

  // Portal to <body>: the sticky header uses backdrop-filter, which would
  // otherwise become the containing block for this fixed overlay and clip it.
  return createPortal(
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-charcoal/35"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-[0_-12px_40px_-20px_rgba(45,41,38,0.3)] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[min(92vw,520px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-charcoal/50">
              Deliver to
            </p>
            <h2
              id={titleId}
              className="mt-1 font-serif text-2xl font-bold tracking-tight text-charcoal"
            >
              Where should we send it?
            </h2>
            <p className="mt-1 text-sm leading-6 text-charcoal/60">
              Prices and delivery are shown for your country.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-charcoal/60 transition hover:bg-charcoal/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40"
          >
            <X size={18} />
          </button>
        </div>

        <ul className="mt-5 space-y-2" aria-label="Countries we deliver to">
          {enabled.map((c, i) => {
            const active = c.code === current;
            return (
              <li key={c.code}>
                <button
                  ref={i === 0 ? firstRef : null}
                  type="button"
                  onClick={() => choose(c.code)}
                  aria-pressed={active}
                  className={`flex min-h-[52px] w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40 ${
                    active
                      ? "border-terracotta bg-[#FDF6EE]"
                      : "border-charcoal/10 bg-white hover:border-charcoal/25"
                  }`}
                >
                  <span>
                    <span className="block text-base font-semibold text-charcoal">
                      {c.name}
                    </span>
                    <span className="block text-xs text-charcoal/55">
                      {currencyLabel(c.currency)}
                    </span>
                  </span>
                  {active ? (
                    <Check
                      size={18}
                      style={{ color: "var(--color-terracotta)" }}
                      aria-hidden
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>

        {comingSoon.length > 0 ? (
          <div className="mt-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-charcoal/40">
              Coming soon
            </p>
            <p className="mt-1 text-xs leading-5 text-charcoal/50">
              We don&apos;t deliver to these countries yet.
            </p>
            <ul
              className="mt-3 flex flex-wrap gap-2"
              aria-label="Countries coming soon"
            >
              {comingSoon.map((c) => (
                <li key={c.code}>
                  <span
                    aria-disabled="true"
                    className="inline-flex min-h-[36px] items-center rounded-full border border-dashed border-charcoal/15 px-3 text-xs font-medium text-charcoal/40"
                  >
                    {c.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

/* ─── Header control ─────────────────────────────────────────────────────── */

export function DestinationButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const current = useDisplayDestination();
  const country = getCountry(current);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-sm font-medium text-charcoal/75 transition hover:bg-charcoal/5 hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40 ${className}`}
      >
        <span className="hidden text-charcoal/50 lg:inline">Deliver to:</span>
        <span className="font-semibold">
          {country?.name ?? "Choose country"}
        </span>
        <ChevronDown size={14} aria-hidden />
      </button>
      <DestinationSelector open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/* ─── Suggestion strip ───────────────────────────────────────────────────── */

const STRIP_DISMISS_KEY = "keepsy_destination_strip_dismissed";

export function DestinationSuggestionStrip({
  suggestedCountry,
}: {
  suggestedCountry?: CountryCode | null;
}) {
  const chosen = useDestination();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Read persisted dismissal after hydration; initial hidden state avoids a flash.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(window.sessionStorage.getItem(STRIP_DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const suggestion =
    getCountry(suggestedCountry ?? DEFAULT_DESTINATION) ??
    getCountry(DEFAULT_DESTINATION)!;

  if (chosen || dismissed) return null;

  const dismiss = () => {
    try {
      window.sessionStorage.setItem(STRIP_DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  const confirm = () => {
    setDestination(suggestion.enabled ? suggestion.code : DEFAULT_DESTINATION);
    dismiss();
  };

  return (
    <div
      className="border-b border-charcoal/8 bg-[#F5EDE0]"
      role="region"
      aria-label="Delivery country"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-2.5 sm:px-8">
        <p className="text-sm text-charcoal/80">
          {suggestion.enabled ? (
            <>
              We think you&apos;re in{" "}
              <span className="font-semibold text-charcoal">
                {suggestion.name}
              </span>{" "}
              — deliver there?
            </>
          ) : (
            <>
              We don&apos;t deliver to {suggestion.name} yet. Showing prices for
              the United Kingdom.
            </>
          )}
        </p>
        <div className="flex items-center gap-1">
          {suggestion.enabled ? (
            <button
              type="button"
              onClick={confirm}
              className="inline-flex min-h-[40px] items-center rounded-full px-4 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40"
              style={{ backgroundColor: "var(--color-terracotta)" }}
            >
              Yes
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex min-h-[40px] items-center rounded-full px-4 text-sm font-semibold text-charcoal transition hover:bg-charcoal/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40"
          >
            Change
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-charcoal/55 transition hover:bg-charcoal/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <DestinationSelector
        open={open}
        onClose={() => setOpen(false)}
        onSelect={() => dismiss()}
      />
    </div>
  );
}
