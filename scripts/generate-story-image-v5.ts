/**
 * Generate a replacement "Our Story" hero image using DALL-E 3.
 * Overwrites public/images/our-story-hero.png
 *
 * Run: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/generate-story-image-v5.ts
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
  "A hyperrealistic candid photograph of three young women in their mid twenties walking together through an open wildflower meadow during golden hour. They are laughing naturally with the middle woman's arms around the other two. Bright open sky above them, no trees or shade — just warm golden sunlight flooding the scene. The meadow has tall grass and soft wildflowers around them. All three are dressed casually in warm light tones — cream, white, soft beige. They are mid-stride walking diagonally towards the camera, relaxed and genuine, not posed. Warm golden light from a low sun creating long soft shadows on the grass. Wide open airy composition with lots of sky and light. Shot on an 85mm lens at f/2.8 with shallow depth of field, sharp focus on faces, soft blurred meadow background. Professional lifestyle editorial photography, bright and airy feel, warm colour palette.";

async function main() {
  console.log("Generating Our Story hero image (v5) with DALL-E 3…");

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
