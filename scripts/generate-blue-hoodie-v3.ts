/**
 * Generate a corrected blue hoodie product image using DALL-E 3.
 * Matches the original flat-lay style but with print correctly positioned
 * above the kangaroo pouch pocket.
 * Overwrites public/images/products/hoodie-blue.jpg
 *
 * Run: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/generate-blue-hoodie-v3.ts
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

// Load .env.local
const envFile = path.join(ROOT, ".env.local");
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, "utf8").split("\n");
  for (const line of lines) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)="?(.+?)"?$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY not found in .env.local");
  process.exit(1);
}

const OUT_FILE = path.join(ROOT, "public", "images", "products", "hoodie-blue.jpg");

const PROMPT =
  "A hyperrealistic flat-lay photograph of a light blue hoodie laid flat on a warm wooden surface, shot from directly above. The hoodie has a beautiful sunset over ocean scene printed on the upper chest area — the print is positioned HIGH on the chest, well ABOVE the kangaroo pouch pocket. There is a clear gap of plain blue fabric between the bottom of the print and the top of the pocket. The kangaroo pouch pocket is completely visible and unobstructed. The hoodie has natural soft fabric texture and subtle creases. Warm natural lighting from the side. A straw sun hat is placed next to the hoodie, and flip flops are visible at the bottom edge. Professional e-commerce flat-lay photography, warm wooden background, magazine quality styling.";

async function main() {
  console.log("Generating blue hoodie image (v3 — flat-lay, print above pouch) with DALL-E 3…");

  const resp = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: PROMPT,
      size: "1024x1024",
      quality: "hd",
      style: "natural",
      response_format: "b64_json",
      n: 1,
    }),
  });

  const data = (await resp.json()) as {
    data?: Array<{ b64_json?: string }>;
    error?: { message?: string };
  };
  if (!resp.ok) {
    console.error("OpenAI error:", data?.error?.message ?? resp.status);
    process.exit(1);
  }

  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) {
    console.error("No image data returned");
    process.exit(1);
  }

  fs.writeFileSync(OUT_FILE, Buffer.from(b64, "base64"));
  console.log(`✓ Saved to ${path.relative(ROOT, OUT_FILE)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
