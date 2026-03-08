/**
 * Generate 3 canvas lifestyle preview images using DALL-E 3.
 * Saves to public/images/canvas/
 *
 * Run: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/generate-canvas-previews.ts
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

const OUT_DIR = path.join(ROOT, "public", "images", "canvas");
fs.mkdirSync(OUT_DIR, { recursive: true });

const IMAGES = [
  {
    filename: "canvas-family.png",
    prompt:
      "A hyperrealistic photograph of a large horizontal canvas print (about 30x20 inches) hanging on a warm white wall above a modern beige sofa. The canvas shows a fun cartoon caricature of a family of four — mum, dad, a young boy and a girl — all smiling and exaggerated in a playful illustrated style. The canvas has visible 1.25 inch gallery-wrap edges. Soft natural window light, cosy modern living room. Magazine quality interior photography.",
  },
  {
    filename: "canvas-pet.png",
    prompt:
      "A hyperrealistic photograph of a medium square canvas print (about 20x20 inches) of a detailed illustrated portrait of a golden retriever dog looking happy and noble, painted in a warm watercolour style. The canvas is hanging on a cream wall in a bright modern hallway next to a coat rack. Visible gallery-wrap depth on the canvas edges. Natural daylight, clean and inviting home setting. Professional interior design photography.",
  },
  {
    filename: "canvas-house.png",
    prompt:
      "A hyperrealistic photograph of a vertical canvas print (about 16x24 inches) of a charming illustrated portrait of a red brick house with a green front door, garden flowers, and a warm golden glow from the windows — a personalised home portrait in a cosy hand-drawn style. Hanging on a light grey wall above a bedside table with a small lamp. Visible 1.25 inch canvas wrap depth. Warm ambient bedroom lighting. High-end lifestyle photography.",
  },
];

async function generateImage(prompt: string, outFile: string) {
  console.log(`Generating ${path.basename(outFile)}…`);
  const resp = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
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
    console.error(`OpenAI error for ${path.basename(outFile)}:`, data?.error?.message ?? resp.status);
    process.exit(1);
  }

  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) {
    console.error(`No image data returned for ${path.basename(outFile)}`);
    process.exit(1);
  }

  fs.writeFileSync(outFile, Buffer.from(b64, "base64"));
  console.log(`✓ Saved ${path.relative(ROOT, outFile)}`);
}

async function main() {
  for (const img of IMAGES) {
    await generateImage(img.prompt, path.join(OUT_DIR, img.filename));
  }
  console.log("\n✓ All canvas preview images generated.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
