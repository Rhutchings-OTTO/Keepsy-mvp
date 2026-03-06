import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "public", "generated-examples");
const API_URL = process.env.GATEWAY_API_URL || "https://www.keepsy.store/api/generate-image";

const PROMPT =
  "A photoreal front elevation photo of a traditional family house, warm brick and cream facade, classic windows, welcoming front door, soft natural daylight, tasteful residential street, realistic photography, no people, no text, premium home portrait composition";

function decodeDataUrl(dataUrl) {
  const match = dataUrl.match(/^data:(image\/png|image\/jpeg);base64,(.+)$/);
  if (!match) throw new Error("Unexpected image payload format");
  return Buffer.from(match[2], "base64");
}

await mkdir(OUT_DIR, { recursive: true });

const response = await fetch(API_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Origin: "https://www.keepsy.store",
    "x-visitor-id": "house-source-photo",
  },
  body: JSON.stringify({
    prompt: PROMPT,
    designShape: "square",
  }),
});

const data = await response.json();
if (!response.ok || !data?.imageDataUrl) {
  throw new Error(data?.error || "generation failed");
}

const imageBuffer = decodeDataUrl(data.imageDataUrl);
const filePath = join(OUT_DIR, "house-source-photo.png");
await writeFile(filePath, imageBuffer);
console.log(`saved ${filePath}`);
