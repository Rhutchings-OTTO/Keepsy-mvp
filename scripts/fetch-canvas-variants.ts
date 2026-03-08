/**
 * Fetch canvas variant IDs from Printify for blueprint 1159.
 *
 * Usage:
 *   npx tsx scripts/fetch-canvas-variants.ts
 *
 * Requires: PRINTIFY_API_TOKEN in .env.local
 */

import * as path from "path";
import * as fs from "fs";

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
    if (key && !(key in process.env)) {
      process.env[key] = val;
    }
  }
}

const root = path.resolve(__dirname, "..");
loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".env.production"));

const BLUEPRINT_ID = 1159;
const API_BASE = "https://api.printify.com/v1";

function getToken(): string {
  const t = process.env.PRINTIFY_API_TOKEN;
  if (!t) throw new Error("PRINTIFY_API_TOKEN is not set");
  return t;
}

function headers() {
  return {
    Authorization: `Bearer ${getToken()}`,
    "User-Agent": "NodeJS",
    "Content-Type": "application/json",
  };
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} from ${url}: ${body.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

type Provider = { id: number; title: string; location: { country: string } };
type Variant = { id: number; title: string; options: { size?: string }; placeholders: Array<{ position: string; width: number; height: number }> };

// Target sizes (WxH in inches)
const TARGET_SIZES = [
  // Horizontal
  "10x8","12x9","14x11","16x12","18x12","20x10","20x16","24x16","24x18","24x20",
  "30x15","30x20","30x24","32x24","36x12","36x24","40x20","40x30","48x16","48x24",
  "48x32","48x36","60x20","60x30","60x40",
  // Vertical
  "8x10","9x12","10x20","11x14","12x16","12x18","12x36","15x30","16x20","16x24",
  "16x48","18x24","20x24","20x30","20x40","20x60","24x30","24x32","24x36","24x48",
  "30x40","30x60","32x48","36x48","40x60",
  // Square
  "6x6","10x10","12x12","14x14","16x16","20x20","24x24","30x30","32x32","36x36",
];

function orientationOf(w: number, h: number): string {
  if (w > h) return "Horizontal";
  if (h > w) return "Vertical";
  return "Square";
}

async function main() {
  console.log(`\nFetching print providers for blueprint ${BLUEPRINT_ID}...`);
  const providers = await fetchJSON<Provider[]>(
    `${API_BASE}/catalog/blueprints/${BLUEPRINT_ID}/print_providers.json`
  );
  console.log(`Found ${providers.length} provider(s):`);
  for (const p of providers) {
    console.log(`  [${p.id}] ${p.title} — ${p.location?.country ?? "?"}`);
  }

  for (const provider of providers) {
    console.log(`\n${"─".repeat(70)}`);
    console.log(`Provider ${provider.id}: ${provider.title}`);
    console.log(`${"─".repeat(70)}`);

    const variantsData = await fetchJSON<{ variants: Variant[] }>(
      `${API_BASE}/catalog/blueprints/${BLUEPRINT_ID}/print_providers/${provider.id}/variants.json`
    );

    const variants = variantsData.variants;
    console.log(`Total variants: ${variants.length}`);

    // Build a map of size label → variant
    const sizeMap = new Map<string, { id: number; title: string }>();

    for (const v of variants) {
      // Variant title is typically like "10x8" or "10\" x 8\"" or "10 x 8"
      // Normalise to WxH
      const raw = v.title.replace(/\s*"\s*/g, "").replace(/\s+x\s+/gi, "x").replace(/\s/g, "");
      sizeMap.set(raw, { id: v.id, title: v.title });
    }

    console.log("\nAll variant titles (raw):");
    for (const v of variants) {
      console.log(`  id=${v.id}  title="${v.title}"`);
    }

    console.log("\nMapping to target sizes:");
    const found: string[] = [];
    const missing: string[] = [];

    for (const size of TARGET_SIZES) {
      // Try exact match first, then various normalizations
      const candidates = [
        size,
        size.replace("x", " x "),
        size.replace(/(\d+)x(\d+)/, '$1" x $2"'),
        size.replace(/(\d+)x(\d+)/, '$1\\" x $2\\"'),
      ];

      let match: { id: number; title: string } | undefined;
      for (const c of candidates) {
        if (sizeMap.has(c)) {
          match = sizeMap.get(c);
          break;
        }
      }

      // Fuzzy: try matching by normalizing all keys
      if (!match) {
        for (const [key, val] of sizeMap) {
          const normalized = key.replace(/[^0-9x]/gi, "").toLowerCase();
          if (normalized === size.toLowerCase()) {
            match = val;
            break;
          }
        }
      }

      const [wStr, hStr] = size.split("x");
      const w = parseInt(wStr);
      const h = parseInt(hStr);
      const orientation = orientationOf(w, h);

      if (match) {
        found.push(size);
        const ratio = (w / h).toFixed(4);
        console.log(`  ✓ ${size.padEnd(8)} (${orientation.padEnd(12)}) ratio=${ratio}  variantId=${match.id}  raw="${match.title}"`);
      } else {
        missing.push(size);
        console.log(`  ✗ ${size.padEnd(8)} (${orientation.padEnd(12)}) — NOT FOUND`);
      }
    }

    console.log(`\nSummary for provider ${provider.id}:`);
    console.log(`  Matched: ${found.length}/${TARGET_SIZES.length}`);
    if (missing.length > 0) {
      console.log(`  Missing: ${missing.join(", ")}`);
    }

    // Print TypeScript snippet for easy copy-paste
    console.log("\n// ── TypeScript variant map snippet ──");
    console.log(`const CANVAS_VARIANTS_PROVIDER_${provider.id}: Record<string, number> = {`);
    for (const size of TARGET_SIZES) {
      const candidates = [size];
      let match: { id: number; title: string } | undefined;
      for (const c of candidates) {
        if (sizeMap.has(c)) { match = sizeMap.get(c); break; }
      }
      if (!match) {
        for (const [key, val] of sizeMap) {
          const normalized = key.replace(/[^0-9x]/gi, "").toLowerCase();
          if (normalized === size.toLowerCase()) { match = val; break; }
        }
      }
      if (match) {
        console.log(`  "${size}": ${match.id},`);
      } else {
        console.log(`  // "${size}": ???,  // NOT FOUND`);
      }
    }
    console.log("};");
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
