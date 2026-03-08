/**
 * Generate a replacement "Our Story" hero image using DALL-E 3.
 * Overwrites public/images/our-story-hero.png
 *
 * Run: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/generate-story-image-v3.ts
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
  "A hyperrealistic candid photograph of three young women in their mid twenties walking diagonally towards the camera on a tree-lined path during golden hour. They are laughing and smiling naturally. The woman in the middle has her arms around the shoulders of the other two. All three are dressed casually in warm earthy tones — cream, soft brown, terracotta, beige. They are mid-stride, relaxed and natural, not posed. Warm golden sunlight from behind creating a beautiful backlit glow and soft lens flare. Blurred bokeh background of green trees and golden light. Shot on an 85mm lens at f/2.8, shallow depth of field with sharp focus on their faces. Professional lifestyle editorial photography, Vogue magazine quality. Warm colour palette.";

async function main() {
  console.log("Generating Our Story hero image (v3) with DALL-E 3…");

  const resp = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: PROMPT,
      size: "1792x1024",
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
