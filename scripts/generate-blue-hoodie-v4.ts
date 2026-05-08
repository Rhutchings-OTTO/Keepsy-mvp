/**
 * Generate a replacement blue hoodie product image using DALL-E 3.
 * Overwrites public/images/products/hoodie-blue.jpg
 *
 * Run: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/generate-blue-hoodie-v4.ts
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
  "A photograph taken on a Canon EOS R5 of a real light blue cotton hoodie lying casually on a cream linen sofa. The hoodie is a standard pullover with a kangaroo pocket. On the upper chest area, well above the kangaroo pocket, there is simple white text that reads 'Jamie & Saida's Wedding 2026' in an elegant serif font, with a small crescent moon and star motif above the text and delicate geometric Islamic pattern border framing the words. No cartoon figures, no illustrations of people — just elegant typography and geometric patterns. The text and design look screen-printed into the cotton fabric with visible fabric texture through the ink. The hoodie has natural cotton creases and wrinkles, it is not perfectly smooth or glossy. The kangaroo pocket is completely clear and unobstructed. Soft natural window light from the left, cream cushions visible in the background. The photo must look like a real product photo taken by a professional photographer, not a digital rendering. Natural cotton fabric texture, matte finish, no shine or gloss on the fabric. ISO 400, 50mm lens, f/2.8, shallow depth of field.";

async function main() {
  const model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
  const isDalle = model.startsWith("dall-e");
  console.log(`Generating blue hoodie image (v4 — Muslim wedding typography) with ${model}…`);

  const body = isDalle
    ? {
        model,
        prompt: PROMPT,
        size: "1024x1024",
        quality: "hd",
        style: "natural",
        response_format: "b64_json",
        n: 1,
      }
    : {
        model,
        prompt: PROMPT,
        size: "1024x1024",
        quality: "high",
        n: 1,
      };

  const resp = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
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
