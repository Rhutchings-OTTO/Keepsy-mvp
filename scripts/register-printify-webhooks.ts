/**
 * Register Printify webhooks for the Keepsy store.
 *
 * Usage:
 *   npx tsx scripts/register-printify-webhooks.ts
 *
 * What it does:
 *   1. Loads PRINTIFY_API_TOKEN from .env.local (fallback: .env.production)
 *   2. Fetches your shop ID from Printify
 *   3. Lists existing webhooks so you can see what's already registered
 *   4. Registers 3 webhooks pointing to https://keepsy.store/api/webhooks/printify:
 *      - order:sent-to-production
 *      - order:shipment:created
 *      - order:shipment:delivered
 *
 * Requires: PRINTIFY_API_TOKEN in .env.local or .env.production
 */

import * as path from "path";
import * as fs from "fs";

// ── Load env ──────────────────────────────────────────────────────────────────

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.local"));
loadEnvFile(path.resolve(process.cwd(), ".env.production"));

console.log("Token starts with:", process.env.PRINTIFY_API_TOKEN?.substring(0, 20));
console.log("Token length:", process.env.PRINTIFY_API_TOKEN?.length);

// ── API helpers ───────────────────────────────────────────────────────────────

const PRINTIFY_API = "https://api.printify.com/v1";

function getHeaders() {
  const token = process.env.PRINTIFY_API_TOKEN;
  if (!token) throw new Error("PRINTIFY_API_TOKEN is not set");
  return {
    Authorization: `Bearer ${token}`,
    "User-Agent": "NodeJS",
    "Content-Type": "application/json",
  };
}

async function apiGet<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${PRINTIFY_API}${endpoint}`, { headers: getHeaders() });
  const text = await res.text();
  if (!res.ok) throw new Error(`GET ${endpoint} failed (${res.status}): ${text.slice(0, 400)}`);
  return JSON.parse(text) as T;
}

async function apiPost<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${PRINTIFY_API}${endpoint}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`POST ${endpoint} failed (${res.status}): ${text.slice(0, 400)}`);
  return JSON.parse(text) as T;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const WEBHOOK_URL = "https://keepsy.store/api/webhooks/printify";

const TOPICS = [
  "order:sent-to-production",
  "order:shipment:created",
  "order:shipment:delivered",
] as const;

async function main() {
  console.log("=== Register Printify Webhooks ===\n");

  // 1. Get shops
  type Shop = { id: number; title: string };
  const shops = await apiGet<Shop[]>("/shops.json");
  if (!shops.length) throw new Error("No shops found on this Printify account");

  const shop = shops[0];
  console.log(`Shop: ${shop.title} (ID: ${shop.id})\n`);

  // 2. List existing webhooks
  type Webhook = { id: string; topic: string; url: string };
  const existing = await apiGet<Webhook[]>(`/shops/${shop.id}/webhooks.json`);
  if (existing.length) {
    console.log("Existing webhooks:");
    for (const wh of existing) {
      console.log(`  [${wh.id}] ${wh.topic} → ${wh.url}`);
    }
  } else {
    console.log("No existing webhooks found.");
  }
  console.log();

  // 3. Register webhooks
  console.log(`Registering webhooks → ${WEBHOOK_URL}\n`);

  for (const topic of TOPICS) {
    const alreadyRegistered = existing.some(
      (wh) => wh.topic === topic && wh.url === WEBHOOK_URL
    );
    if (alreadyRegistered) {
      console.log(`  ✓ Already registered: ${topic}`);
      continue;
    }

    try {
      const result = await apiPost<Webhook>(`/shops/${shop.id}/webhooks.json`, {
        topic,
        url: WEBHOOK_URL,
      });
      console.log(`  ✓ Registered: ${topic}`);
      console.log(`    ID: ${result.id}`);
    } catch (err) {
      console.error(`  ✗ Failed to register ${topic}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log("\n=== Done ===");
}

main().catch((err) => {
  console.error("\n✗ Script failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
