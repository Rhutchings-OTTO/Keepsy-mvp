/**
 * Generate a replacement blue hoodie product image using DALL-E 3.
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
  "A hyperrealistic photograph of a light blue pullover hoodie lying casually on a cream linen sofa. The hoodie is unfolded and relaxed with natural fabric wrinkles and creases. On the upper chest area there is a small cute cartoon illustration of a bride and groom holding hands with the text 'Jay's Wedding Party 2026' printed in a clean white handwritten font beneath the illustration. The print is small and centered on the chest, well above the kangaroo pocket. The print looks like it is part of the fabric — you can see the cotton texture through the ink, not like a digital overlay. The kangaroo pouch pocket is fully visible and unobstructed below. A couple of scatter cushions are visible on the sofa behind the hoodie. Soft warm natural daylight from a nearby window. The scene looks like someone just took the hoodie off and laid it on the sofa. Shot on a 50mm lens, shallow depth of field, professional lifestyle product photography.";

async function main() {
  console.log("Generating blue hoodie image (wedding party lifestyle) with DALL-E 3…");

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
