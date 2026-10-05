"use client";
import { useState } from "react";
export function ImportContacts() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function run() {
    setBusy(true);
    let count = 0;
    try {
      for (const source of ["orders", "subscribers"]) {
        let offset: number | null = 0;
        while (offset !== null) {
          const r: Response = await fetch("/api/crm/backfill", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ source, offset }),
          });
          const d: {
            error?: string;
            processed: number;
            nextOffset: number | null;
          } = await r.json();
          if (!r.ok) throw new Error(d.error || "Import failed");
          count += d.processed;
          offset = d.nextOffset;
          setMessage(count + " records checked…");
        }
      }
      setMessage(
        "Import complete. Existing marketing preferences were preserved. Refresh to see the contacts.",
      );
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Import failed. Safe to retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="my-6">
      <button
        disabled={busy}
        className="rounded-full border border-black/20 px-5 py-3 text-sm disabled:opacity-50"
        onClick={run}
      >
        {busy ? "Importing…" : "Import past customers and signups"}
      </button>
      <p role="status" className="mt-3 text-sm">
        {message}
      </p>
    </div>
  );
}
