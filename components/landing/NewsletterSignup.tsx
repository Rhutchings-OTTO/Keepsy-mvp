"use client";

/**
 * Newsletter / welcome-code capture with explicit consent.
 *
 * Contract: POST /api/subscribe
 *   { email, consent: true, consentTextVersion, source, website: "" }
 *   -> { ok: true, state: "welcome_sent" | "already_subscribed" | "existing_customer" | "queued" }
 *   -> { error: { code, message } } | { error, message }
 *
 * The checkbox starts UNCHECKED; submit is disabled until it is ticked.
 * `website` is a honeypot (visually hidden, autocomplete off).
 */

import { useId, useState } from "react";
import {
  MARKETING_CONSENT_TEXT,
  CURRENT_NEWSLETTER_CONSENT_VERSION,
} from "@/lib/crm/consentText";
import {
  WELCOME_PERCENT,
  welcomeConditionsText,
} from "@/lib/commerce/discountPolicy";
import type { Currency } from "@/lib/commerce/pricing";

type SubscribeState =
  | "welcome_sent"
  | "already_subscribed"
  | "existing_customer"
  | "queued";

type SubscribeResponse =
  | { ok: true; state: SubscribeState }
  | { error: { code?: string; message?: string } }
  | { error: string; message?: string };

const RESULT_COPY: Record<SubscribeState, string> = {
  welcome_sent: "Check your inbox for your code.",
  queued: "Check your inbox for your code.",
  already_subscribed:
    "You're already on the list — your code was sent to you before.",
  existing_customer:
    "Thanks! The welcome code is for first orders, but you're on the list for gift ideas.",
};

function readErrorMessage(data: SubscribeResponse | null): string {
  if (!data || !("error" in data))
    return "Something went wrong. Please try again.";
  if (typeof data.error === "string")
    return (
      ("message" in data ? data.message : undefined) ||
      data.error ||
      "Something went wrong. Please try again."
    );
  return data.error?.message || "Something went wrong. Please try again.";
}

export type NewsletterSignupProps = {
  source: "homepage" | "footer";
  currency: Currency;
  /** "dark" for the charcoal footer, "light" for cream/white sections. */
  tone?: "light" | "dark";
  /** Show the headline block (homepage). Footer supplies its own. */
  showHeading?: boolean;
  className?: string;
};

export function NewsletterSignup({
  source,
  currency,
  tone = "light",
  showHeading = false,
  className = "",
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SubscribeState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ids = {
    email: useId(),
    consent: useId(),
    hint: useId(),
    website: useId(),
  };

  const dark = tone === "dark";
  const text = dark ? "text-white" : "text-charcoal";
  const muted = dark ? "text-white/65" : "text-charcoal/60";
  const inputClass = dark
    ? "w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-[16px] text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
    : "w-full rounded-xl border border-charcoal/15 bg-white px-4 py-3 text-[16px] text-charcoal placeholder:text-charcoal/40 focus:border-terracotta/60 focus:outline-none focus:ring-2 focus:ring-terracotta/20";
  const consentText =
    MARKETING_CONSENT_TEXT[CURRENT_NEWSLETTER_CONSENT_VERSION];
  const canSubmit = consent && email.trim().length > 3 && !loading;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    const form = e.currentTarget;
    const website =
      (form.elements.namedItem("website") as HTMLInputElement | null)?.value ??
      "";
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          consent: true,
          consentTextVersion: CURRENT_NEWSLETTER_CONSENT_VERSION,
          source,
          website,
        }),
      });
      let data: SubscribeResponse | null = null;
      try {
        data = (await res.json()) as SubscribeResponse;
      } catch {
        data = null;
      }
      if (res.ok && data && "ok" in data && data.ok) {
        setResult(data.state in RESULT_COPY ? data.state : "queued");
      } else {
        setError(readErrorMessage(data));
      }
    } catch {
      setError("We couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      {showHeading ? (
        <div className="mb-6">
          <h2
            className={`font-serif text-3xl font-bold tracking-[-0.03em] sm:text-4xl ${text}`}
          >
            {WELCOME_PERCENT}% off your first order
          </h2>
          <p className={`mt-3 max-w-md text-base leading-7 ${muted}`}>
            Join the list and we&apos;ll email you a welcome code, plus
            occasional gift ideas. No spam.
          </p>
        </div>
      ) : null}

      {result ? (
        <p
          role="status"
          className={`rounded-xl px-4 py-3 text-sm font-semibold ${dark ? "bg-white/10 text-white" : "bg-[#F5EDE0] text-charcoal"}`}
        >
          {RESULT_COPY[result]}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="relative space-y-3" noValidate>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor={ids.email} className="sr-only">
              Email address
            </label>
            <input
              id={ids.email}
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
              aria-describedby={ids.hint}
            />
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: "var(--color-terracotta)" }}
            >
              {loading ? "Sending…" : "Send my code"}
            </button>
          </div>

          {/* Honeypot — hidden from people, visible to bots */}
          <div
            className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden"
            aria-hidden="true"
          >
            <label htmlFor={ids.website}>Website</label>
            <input
              id={ids.website}
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              defaultValue=""
            />
          </div>

          <label
            htmlFor={ids.consent}
            className={`flex cursor-pointer items-start gap-3 text-sm leading-6 ${muted}`}
          >
            <input
              id={ids.consent}
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded border-charcoal/30 accent-[#C4714A]"
            />
            <span>{consentText}</span>
          </label>

          <p
            id={ids.hint}
            className={`text-xs leading-5 ${dark ? "text-white/45" : "text-charcoal/50"}`}
          >
            {consent
              ? welcomeConditionsText(currency)
              : "Tick the box to get your code — we only email people who ask us to."}
          </p>

          {error ? (
            <p
              role="alert"
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${dark ? "bg-white/10 text-white" : "bg-[rgba(196,113,74,0.10)] text-[#A05A38]"}`}
            >
              {error}
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}
