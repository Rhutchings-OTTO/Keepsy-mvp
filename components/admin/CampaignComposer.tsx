"use client";
import { useState } from "react";
export function CampaignComposer() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [id, setId] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function act(action: "preview" | "queue") {
    setBusy(true);
    try {
      const r = await fetch("/api/email/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, subject, body, id: id || undefined }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Try again.");
      if (action === "preview") {
        setId(d.id);
        setCount(d.count);
        setMessage(
          "Draft saved. Review the copy and recipient count below before sending.",
        );
      } else {
        setMessage(
          "Campaign queued. Each recipient's permission will be checked again before sending.",
        );
        setCount(null);
        setId("");
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Try again.");
    } finally {
      setBusy(false);
    }
  }
  function changed() {
    setId("");
    setCount(null);
  }
  return (
    <section className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8">
      <h2 className="font-serif text-2xl">Write a campaign</h2>
      <label className="mt-6 block text-sm">
        Subject
        <input
          className="mt-2 w-full rounded-xl border p-3"
          maxLength={150}
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            changed();
          }}
        />
      </label>
      <label className="mt-5 block text-sm">
        Message
        <textarea
          rows={6}
          className="mt-2 w-full rounded-xl border p-3"
          maxLength={6000}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            changed();
          }}
        />
      </label>
      <p className="my-4 text-xs text-black/60">
        Keepsy branding, a link to create a gift and an unsubscribe link are
        added automatically.
      </p>
      <button
        disabled={busy || !subject.trim() || !body.trim()}
        onClick={() => act("preview")}
        className="rounded-full border border-black/20 px-6 py-3 disabled:opacity-50"
      >
        Save and review
      </button>
      {count !== null && (
        <div className="mt-6 rounded-2xl bg-[#FDF6EE] p-6">
          <h3 className="font-serif text-xl">{subject}</h3>
          <p className="my-4 whitespace-pre-wrap">{body}</p>
          <p className="text-sm">
            {count} eligible contacts. Unsubscribed and unconfirmed-permission
            contacts are excluded.
          </p>
          <button
            disabled={busy || count === 0}
            onClick={() => act("queue")}
            className="mt-5 rounded-full bg-[#2C4A3E] px-6 py-3 text-white disabled:opacity-50"
          >
            Send to eligible contacts
          </button>
        </div>
      )}
      <p role="status" className="mt-5 text-sm">
        {message}
      </p>
    </section>
  );
}
