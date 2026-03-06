import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "public", "generated-hero");
const API_URL = process.env.GATEWAY_API_URL || "https://www.keepsy.store/api/generate-image";

const PROMPT =
  "A single tall hand drawn storybook illustration on textured ivory paper, whimsical classic English children's book feeling, soft watercolor and gouache, muted cream, warm stone, dusty blue and sage palette. In the upper left: a realistic traditional brick family house in ordinary weather. A winding painted arrow path leads to the upper middle and center: the same house from a slightly different angle, now decorated for Christmas with snow, warm windows, wreath and little Christmas trees. Another winding painted arrow path leads downward to the lower right: a hand drawn greeting card with envelope featuring that same snowy house artwork on the front as a finished keepsake. One continuous illustration, portrait composition, not separate panels, premium editorial composition, balanced negative space, no text, no people.";

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
    "x-visitor-id": "hero-storyboard-house",
  },
  body: JSON.stringify({
    prompt: PROMPT,
    designShape: "portrait",
  }),
});

const data = await response.json();
if (!response.ok || !data?.imageDataUrl) {
  throw new Error(data?.error || "generation failed");
}

const imageBuffer = decodeDataUrl(data.imageDataUrl);
const filePath = join(OUT_DIR, "house-journey.png");
await writeFile(filePath, imageBuffer);
console.log(`saved ${filePath}`);
