import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export type GenerationMetrics = {
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

const metrics: GenerationMetrics = {
  inFlightCount: 0,
  cacheHits: 0,
  cacheMisses: 0,
  dedupedHits: 0,
  busyRejects: 0,
  totalRequests: 0,
  totalSuccess: 0,
  totalErrors: 0,
  lastLatencyMs: null,
};

let lastPersistAtMs = 0;
const PERSIST_INTERVAL_MS = 30_000;
let persistInFlight: Promise<void> | null = null;

export function getGenerationMetrics(): GenerationMetrics {
  return { ...metrics };
}

export function recordGenerationMetric(
  key: keyof GenerationMetrics,
  deltaOrValue: number
): void {
  if (key === "lastLatencyMs") {
    metrics.lastLatencyMs = deltaOrValue;
    return;
  }
  metrics[key] = (metrics[key] as number) + deltaOrValue;
}

async function persistMetricsSnapshot(): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const snapshot = getGenerationMetrics();
  await supabase.from("perf_metrics").insert({
    source: "generate-image",
    created_at: new Date().toISOString(),
    in_flight_count: snapshot.inFlightCount,
    cache_hits: snapshot.cacheHits,
    cache_misses: snapshot.cacheMisses,
    deduped_hits: snapshot.dedupedHits,
    busy_rejects: snapshot.busyRejects,
    total_requests: snapshot.totalRequests,
    total_success: snapshot.totalSuccess,
    total_errors: snapshot.totalErrors,
    last_latency_ms: snapshot.lastLatencyMs,
  });
}

export function persistMetricsIfDue(): void {
  const now = Date.now();
  if (now - lastPersistAtMs < PERSIST_INTERVAL_MS) return;
  if (persistInFlight) return;

  lastPersistAtMs = now;
  persistInFlight = persistMetricsSnapshot()
    .catch(() => {
      // Best-effort persistence only.
    })
    .finally(() => {
      persistInFlight = null;
    });
}

