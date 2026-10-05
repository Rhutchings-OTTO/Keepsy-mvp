"use client";
import { useState } from "react";
export function NotificationSetup() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function enable() {
    setBusy(true);
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window))
        throw new Error(
          "On iPhone, open Keepsy in Safari, choose Share → Add to Home Screen, then open it from your Home Screen.",
        );
      const r = await fetch("/api/owner/push");
      const data = await r.json();
      if (!r.ok || !data.publicKey)
        throw new Error(
          "Phone alerts need server configuration before this device can be connected.",
        );
      const permission = await Notification.requestPermission();
      if (permission !== "granted")
        throw new Error(
          "Notifications are not allowed. You can change this in your browser settings.",
        );
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const raw = atob(data.publicKey.replace(/-/g, "+").replace(/_/g, "/"));
      const key = Uint8Array.from(raw, (c) => c.charCodeAt(0));
      const sub =
        (await reg.pushManager.getSubscription()) ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key,
        }));
      const saved = await fetch("/api/owner/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!saved.ok)
        throw new Error("Could not save this device. Please try again.");
      await fetch("/api/owner/notifications/drain", { method: "POST" });
      setMessage("Device connected. A test alert has been queued.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="rounded-3xl border border-black/10 bg-white p-8">
      <h2 className="font-serif text-2xl">Phone notifications</h2>
      <p className="my-4 max-w-2xl text-black/65">
        Receive an alert when an order is paid or needs attention. On iPhone,
        add this page to your Home Screen in Safari first, then open it there.
      </p>
      <button
        disabled={busy}
        onClick={enable}
        className="rounded-full bg-[#2C4A3E] px-6 py-3 text-white"
      >
        {busy ? "Connecting…" : "Enable on this device"}
      </button>
      <p role="status" className="mt-4">
        {message}
      </p>
    </section>
  );
}
