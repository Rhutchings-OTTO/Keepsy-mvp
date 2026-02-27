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

