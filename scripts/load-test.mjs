#!/usr/bin/env node

import { performance } from "node:perf_hooks";
import { randomUUID } from "node:crypto";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const PATHNAME = process.env.LOADTEST_PATH || "/api/generate-image";
const CONCURRENCY = Number(process.env.CONCURRENCY || 5);
const DURATION_SEC = Number(process.env.DURATION_SEC || 30);
const PROMPT_PREFIX = process.env.PROMPT_PREFIX || "watercolor family keepsake illustration";

const testEndAt = Date.now() + DURATION_SEC * 1000;
const latencies = [];
const statusCounts = new Map();
let networkErrors = 0;
let completed = 0;

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

function addStatus(status) {
  statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
}

async function worker(workerId) {
  while (Date.now() < testEndAt) {
    const started = performance.now();
    const prompt = `${PROMPT_PREFIX} ${workerId} ${Date.now()} ${Math.random().toString(36).slice(2, 9)}`;
    try {
      const res = await fetch(`${BASE_URL}${PATHNAME}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-visitor-id": `loadtest-${workerId}-${randomUUID()}`,
        },
        body: JSON.stringify({ prompt }),
      });
      await res.json().catch(() => ({}));
      addStatus(res.status);
    } catch {
      networkErrors += 1;
      addStatus("network_error");
    } finally {
      latencies.push(performance.now() - started);
      completed += 1;
    }
  }
}

async function run() {
  console.log(`Load test starting: ${BASE_URL}${PATHNAME}`);
  console.log(`Concurrency=${CONCURRENCY}, Duration=${DURATION_SEC}s`);
  const start = performance.now();
  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1)));
  const elapsedMs = performance.now() - start;
  const rps = completed / (elapsedMs / 1000);

  console.log("\nResults");
  console.log(`Requests: ${completed}`);
  console.log(`Elapsed: ${(elapsedMs / 1000).toFixed(2)}s`);
  console.log(`RPS: ${rps.toFixed(2)}`);
  console.log(`p50: ${percentile(latencies, 50).toFixed(0)}ms`);
  console.log(`p95: ${percentile(latencies, 95).toFixed(0)}ms`);
  console.log(`p99: ${percentile(latencies, 99).toFixed(0)}ms`);
  console.log(`Network errors: ${networkErrors}`);
  console.log("Status counts:");
  for (const [status, count] of statusCounts.entries()) {
    console.log(`  ${status}: ${count}`);
  }
}

run().catch((error) => {
  console.error("Load test failed:", error);
  process.exit(1);
});

