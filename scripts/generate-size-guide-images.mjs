/**
 * One-time script: generate professional garment measurement diagrams
 * using DALL-E 3 and save them to public/size-guide/.
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

const OUT_DIR = path.join(ROOT, "public", "size-guide");
fs.mkdirSync(OUT_DIR, { recursive: true });

const IMAGES = [
  {
    file: path.join(OUT_DIR, "tshirt-measurements.png"),
    prompt:
      "A clean, minimal, professional flat-lay technical illustration of a white t-shirt on a plain white background. The t-shirt is shown from the front, laid flat. Three measurement lines are drawn on it with clean arrows: a horizontal double-arrow across the chest labelled 'Width', a vertical double-arrow from shoulder to hem labelled 'Length', and a diagonal line from center back neck to sleeve end labelled 'Sleeve length'. The style looks like a premium e-commerce size guide — clean lines, minimal detail, warm beige/cream coloured garment, dark brown measurement lines and labels in a clean sans-serif font. No wrinkles, no shadows, no background texture. Professional technical drawing style.",
  },
  {
    file: path.join(OUT_DIR, "hoodie-measurements.png"),
    prompt:
      "A clean, minimal, professional flat-lay technical illustration of a white hoodie on a plain white background. The hoodie is shown from the front, laid flat, with the hood clearly visible at the top. Three measurement lines are drawn on it with clean arrows: a horizontal double-arrow across the chest labelled 'Width', a vertical double-arrow from shoulder to hem labelled 'Length', and a diagonal line from center back neck to sleeve end labelled 'Sleeve length'. The style looks like a premium e-commerce size guide — clean lines, minimal detail, warm beige/cream coloured garment, dark brown measurement lines and labels in a clean sans-serif font. No wrinkles, no shadows, no background texture. Professional technical drawing style.",
  },
];

async function generateImage(prompt, outFile) {
  const label = path.basename(outFile);
  const model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
  const isDalle = model.startsWith("dall-e");
  console.log(`Generating ${label} with ${model}…`);

  const body = isDalle
    ? {
        model,
        prompt,
        size: "1024x1024",
        quality: "standard",
        style: "natural",
        response_format: "b64_json",
        n: 1,
      }
    : {
        model,
        prompt,
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

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(`OpenAI error: ${data?.error?.message ?? resp.status}`);
  }

  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image data returned");

  fs.writeFileSync(outFile, Buffer.from(b64, "base64"));
  console.log(`  ✓ Saved to ${path.relative(ROOT, outFile)}`);
}

for (const img of IMAGES) {
  await generateImage(img.prompt, img.file);
}

console.log("\nDone. Both images saved to public/size-guide/");
