"use client";
import { useState } from "react";
export function DispatchQueueButton() {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function drain() {
    setBusy(true);
    try {
      const r = await fetch("/api/owner/notifications/drain", {
        method: "POST",
      });
      const d = await r.json();
      if (!r.ok)
        throw new Error("Delivery service is unavailable. Please try again.");
      setMessage(
        "Processed due messages: " +
          d.email.sent +
          " emails, " +
          d.notifications.sent +
          " owner alerts.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Try again shortly.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-6">
      <button
        type="button"
        disabled={busy}
        onClick={drain}
        className="rounded-full border border-black/20 px-5 py-3 text-sm disabled:opacity-50"
      >
        {busy ? "Processing…" : "Process due messages"}
      </button>
      <p role="status" className="mt-3 text-sm">
        {message}
      </p>
    </div>
  );
}
