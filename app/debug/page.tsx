"use client";

import { useEffect, useState } from "react";

type DebugStatus = {
  ok: boolean;
  timestamp: string;
  openai: {
    configured: boolean;
    pingMs: number | null;
    error?: string;
    creditsNote: string;
  };
  stripe: {
    configured: boolean;
    mode: string;
    webhookConfigured: boolean;
    webhookNote: string;
  };
  imageHost: {
    provider: string;
    configured: boolean;
    testUploadOk: boolean | null;
    error?: string;
  };
};

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
        ok ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-emerald-500" : "bg-amber-500"}`} />
      {label}
    </span>
  );
}

export default function DebugPanelPage() {
  const [data, setData] = useState<DebugStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const k = params.get("key");
    if (k) setKey(k);
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const headers: HeadersInit = {};
        if (key) headers["x-debug-key"] = key;
        const res = await fetch("/api/debug/status", {
          cache: "no-store",
          headers: key ? { "x-debug-key": key } : undefined,
        });
        const json = (await res.json()) as DebugStatus & { error?: string };
        if (!res.ok) {
          throw new Error(json?.error ?? "Failed to load debug status.");
        }
        if (!active) return;
        setData(json);
        setError(null);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Failed to load status.");
        setData(null);
      }
    };

    if (key || process.env.NODE_ENV === "development") {
      load();
      const interval = window.setInterval(load, 15000);
      return () => {
        active = false;
        clearInterval(interval);
      };
    }
  }, [key]);

  const needsKey = !key && process.env.NODE_ENV === "production";

  return (
    <main className="min-h-screen bg-[#0f0f0f] px-6 py-10 text-[#e5e5e5] font-mono">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="border-b border-white/10 pb-4">
          <h1 className="text-2xl font-black text-white">Debug Panel</h1>
          <p className="mt-1 text-xs text-white/50">
            Hidden — only visible with correct key. Add <code className="rounded bg-white/10 px-1">?key=YOUR_DEBUG_PANEL_KEY</code> or set{" "}
            <code className="rounded bg-white/10 px-1">DEBUG_PANEL_KEY</code> in .env.local
          </p>
          {needsKey && (
            <div className="mt-4 flex items-center gap-2">
              <input
                type="password"
                placeholder="Debug key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && key && (window.location.href = `/debug?key=${encodeURIComponent(key)}`)}
                className="rounded border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40"
              />
              <button
                type="button"
                onClick={() => {
                  if (key) window.location.href = `/debug?key=${encodeURIComponent(key)}`;
                }}
                className="rounded bg-white/10 px-3 py-2 text-sm font-bold hover:bg-white/20"
              >
                Unlock
              </button>
            </div>
          )}
        </header>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {/* OpenAI */}
            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white/70">OpenAI</h2>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Status</span>
                  <StatusBadge ok={data.openai.configured && !data.openai.error} label={data.openai.error ? "Error" : data.openai.configured ? "Configured" : "Not configured"} />
                </div>
                {data.openai.pingMs !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Latency</span>
                    <span className="font-mono">{data.openai.pingMs} ms</span>
                  </div>
                )}
                {data.openai.error && (
                  <p className="text-amber-400/90">{data.openai.error}</p>
                )}
                <p className="text-xs text-white/40">{data.openai.creditsNote}</p>
              </div>
            </section>

            {/* Stripe */}
            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white/70">Stripe</h2>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Mode</span>
                  <StatusBadge ok={data.stripe.configured} label={data.stripe.mode} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Webhook</span>
                  <StatusBadge ok={data.stripe.webhookConfigured} label={data.stripe.webhookConfigured ? "Connected" : "Not configured"} />
                </div>
                <p className="text-xs text-white/40">{data.stripe.webhookNote}</p>
              </div>
            </section>

            {/* Image Host */}
            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white/70">Image Host</h2>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Provider</span>
                  <span>{data.imageHost.provider}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Storage</span>
                  <StatusBadge
                    ok={data.imageHost.configured && data.imageHost.testUploadOk === true}
                    label={
                      data.imageHost.testUploadOk === true
                        ? "Verified (test upload OK)"
                        : data.imageHost.testUploadOk === false
                          ? "Upload failed"
                          : data.imageHost.configured
                            ? "Configured"
                            : "Not configured"
                    }
                  />
                </div>
                {data.imageHost.error && (
                  <p className="text-amber-400/90">{data.imageHost.error}</p>
                )}
              </div>
            </section>

            <p className="text-center text-xs text-white/30">
              Refreshes every 15s · {data.timestamp && new Date(data.timestamp).toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
