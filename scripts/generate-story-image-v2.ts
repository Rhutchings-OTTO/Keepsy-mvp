/**
 * Generate a replacement "Our Story" hero image using DALL-E 3.
 * Overwrites public/images/our-story-hero.png
 *
 * Run: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/generate-story-image-v2.ts
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

const OUT_FILE = path.join(ROOT, "public", "images", "our-story-hero.png");

const PROMPT =
  "A hyperrealistic photograph of two women in their mid 30s walking together and laughing on a tree-lined path in a park during golden hour. Full body shot from the waist up, showing them walking side by side with one woman's arm linked through the other's. They are dressed casually in warm autumn tones — cream, terracotta, soft brown. Both laughing naturally, not looking at camera. Soft golden sunlight filtering through trees behind them, slightly blurred background with warm bokeh. Shot on a 50mm lens, natural and candid feel. Professional lifestyle photography, magazine editorial quality. Warm colour palette matching cream and terracotta tones.";

async function main() {
  const model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
  const isDalle = model.startsWith("dall-e");
  console.log(`Generating Our Story hero image (v2) with ${model}…`);

  const body = isDalle
    ? {
        model,
        prompt: PROMPT,
        size: "1792x1024",
        quality: "hd",
        style: "natural",
        response_format: "b64_json",
        n: 1,
      }
    : {
        model,
        prompt: PROMPT,
        size: "1536x1024",
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
