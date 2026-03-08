"use client";

import Link from "next/link";
import { useState } from "react";

export default function SubjectAccessRequestPage() {
  const [email, setEmail] = useState("");
  const [requestType, setRequestType] = useState("Access my data");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/sar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, requestType }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setError(data.error ?? "Something went wrong. Please try again or email privacy@keepsy.co directly.");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Something went wrong. Please try again or email privacy@keepsy.co directly.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 sm:py-24" style={{ backgroundColor: "var(--color-cream)" }}>
      <Link
        href="/privacy"
        className="mb-12 inline-flex items-center gap-2 text-sm font-semibold transition hover:opacity-70"
        style={{ color: "var(--color-terracotta)" }}
      >
        ← Back to Privacy Policy
      </Link>

      <div className="rounded-2xl border border-charcoal/8 bg-white p-8 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.12)] sm:p-10">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.35em]"
          style={{ color: "var(--color-terracotta)" }}
        >
          Your Rights
        </p>
        <h1
          className="mt-3 font-serif text-4xl font-semibold tracking-[-0.03em] sm:text-5xl"
          style={{ color: "var(--color-charcoal)" }}
        >
          Subject Access Request
        </h1>
        <p className="mt-4 text-base leading-8" style={{ color: "rgba(45,41,38,0.65)" }}>
          Under UK GDPR, you have the right to access, correct, delete, or receive a copy of the personal data
          Keepsy holds about you. Complete the form below and we will respond within 30 days as required by law.
        </p>

        <div
          className="mt-6 rounded-xl border p-5 text-sm leading-7"
          style={{ borderColor: "rgba(45,41,38,0.08)", backgroundColor: "#F9F8F6", color: "rgba(45,41,38,0.7)" }}
        >
          <p className="font-semibold" style={{ color: "var(--color-charcoal)" }}>Your rights under UK GDPR include:</p>
          <ul className="mt-2 space-y-1">
            <li>• <strong>Right of access (Art. 15)</strong> — receive a copy of all personal data we hold about you</li>
            <li>• <strong>Right to rectification (Art. 16)</strong> — ask us to correct inaccurate or incomplete data</li>
            <li>• <strong>Right to erasure (Art. 17)</strong> — ask us to delete your personal data ("right to be forgotten")</li>
            <li>• <strong>Right to data portability (Art. 20)</strong> — receive your data in a structured, machine-readable format</li>
          </ul>
        </div>

        {submitted ? (
          <div
            className="mt-8 rounded-2xl border p-8 text-center"
            style={{ borderColor: "rgba(43,64,56,0.2)", backgroundColor: "rgba(43,64,56,0.06)" }}
          >
            <p className="font-serif text-xl font-bold" style={{ color: "var(--color-charcoal)" }}>
              Request received.
            </p>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(45,41,38,0.65)" }}>
              We&apos;ve received your request and will respond within 30 days as required by UK GDPR.
              You will receive a confirmation at <strong>{email}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={(e) => { void handleSubmit(e); }} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="sar-email"
                className="mb-2 block text-sm font-semibold"
                style={{ color: "var(--color-charcoal)" }}
              >
                Your email address
              </label>
              <input
                id="sar-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-charcoal/15 bg-white px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2"
                style={{ fontFamily: "inherit" }}
              />
              <p className="mt-1.5 text-xs" style={{ color: "rgba(45,41,38,0.45)" }}>
                We&apos;ll use this to identify your data and respond to your request.
              </p>
            </div>

            <div>
              <label
                htmlFor="sar-type"
                className="mb-2 block text-sm font-semibold"
                style={{ color: "var(--color-charcoal)" }}
              >
                Type of request
              </label>
              <select
                id="sar-type"
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
                className="w-full rounded-xl border border-charcoal/15 bg-white px-4 py-3 text-sm text-charcoal focus:outline-none focus:ring-2"
                style={{ fontFamily: "inherit" }}
              >
                <option value="Access my data">Access my data — receive a copy of all data we hold</option>
                <option value="Delete my data">Delete my data — erase all personal data Keepsy holds</option>
                <option value="Correct my data">Correct my data — fix inaccurate or incomplete data</option>
                <option value="Data portability">Data portability — receive my data in a portable format</option>
              </select>
            </div>

            {error && (
              <p
                className="rounded-lg border px-4 py-3 text-sm"
                style={{ borderColor: "rgba(220,38,38,0.3)", backgroundColor: "rgba(220,38,38,0.06)", color: "#b91c1c" }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-xl py-3.5 text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--color-terracotta)" }}
            >
              {isSubmitting ? "Submitting…" : "Submit Request"}
            </button>

            <p className="text-center text-xs" style={{ color: "rgba(45,41,38,0.45)" }}>
              We respond to all requests within 30 days as required by UK GDPR.
              For urgent matters, email{" "}
              <a
                href="mailto:privacy@keepsy.co"
                className="font-semibold underline underline-offset-2"
                style={{ color: "var(--color-terracotta)" }}
              >
                privacy@keepsy.co
              </a>{" "}
              directly.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
