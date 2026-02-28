"use client";

import { useEffect, useMemo, useState } from "react";

type GenerationMetrics = {
  inFlightCount: number;
  cacheHits: number;
  cacheMisses: number;
  dedupedHits: number;
  busyRejects: number;
  totalRequests: number;
  totalSuccess: number;
  totalErrors: number;
  lastLatencyMs: number | null;
};

type PerfResponse = {
  ok: boolean;
  timestamp: string;
  generation: GenerationMetrics;
};

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-black/50">{label}</p>
      <p className="mt-2 text-2xl font-black text-black">{value}</p>
    </article>
  );
}

export default function PerfDashboardPage() {
  const [data, setData] = useState<PerfResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [perfKey, setPerfKey] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get("key");
    if (key) setPerfKey(key);
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const headers: HeadersInit = {};
        if (perfKey) headers["x-perf-key"] = perfKey;
        const res = await fetch("/api/health/perf", { cache: "no-store", headers });
        const json = (await res.json()) as PerfResponse;
        if (!res.ok) {
          throw new Error((json as { error?: string })?.error || "Failed to load perf metrics.");
        }
        if (!active) return;
        setData(json);
        setError(null);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Failed to load metrics.");
      }
    };

    load();
    const interval = window.setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [perfKey]);

  const successRate = useMemo(() => {
    if (!data?.generation.totalRequests) return "0%";
    return `${Math.round((data.generation.totalSuccess / data.generation.totalRequests) * 100)}%`;
  }, [data]);

  const cacheHitRate = useMemo(() => {
    if (!data?.generation.totalRequests) return "0%";
    return `${Math.round((data.generation.cacheHits / data.generation.totalRequests) * 100)}%`;
  }, [data]);

  return (
    <main className="min-h-screen bg-[#F7F1EB] px-6 py-10 text-[#23211F]">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="text-4xl font-black">Performance Dashboard</h1>
          <p className="mt-2 text-sm font-semibold text-black/60">
            Live generation service metrics (refreshes every 5s).
          </p>
          <p className="mt-1 text-xs font-semibold text-black/45">
            In production, open with <code className="rounded bg-black/5 px-1 py-0.5">/perf?key=YOUR_PERF_DASHBOARD_KEY</code>.
          </p>
          {data?.timestamp && (
            <p className="mt-1 text-xs font-semibold text-black/45">
              Last updated: {new Date(data.timestamp).toLocaleTimeString()}
            </p>
          )}
        </header>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="In Flight" value={data?.generation.inFlightCount ?? 0} />
          <StatCard label="Total Requests" value={data?.generation.totalRequests ?? 0} />
          <StatCard label="Success Rate" value={successRate} />
          <StatCard label="Cache Hit Rate" value={cacheHitRate} />
          <StatCard label="Last Latency" value={`${data?.generation.lastLatencyMs ?? 0} ms`} />
          <StatCard label="Busy Rejects" value={data?.generation.busyRejects ?? 0} />
          <StatCard label="Deduped Hits" value={data?.generation.dedupedHits ?? 0} />
          <StatCard label="Total Errors" value={data?.generation.totalErrors ?? 0} />
        </section>
      </div>
    </main>
  );
}

