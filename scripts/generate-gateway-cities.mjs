import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "public", "generated-gateway");
const API_URL = process.env.GATEWAY_API_URL || "https://www.keepsy.store/api/generate-image";

const CITIES = [
  {
    slug: "london-watercolor",
    prompt:
      "A refined tonal watercolor skyline of London, soft ivory sky, muted slate blue and warm stone palette, elegant painterly wash, subtle London Eye, Elizabeth Tower and Shard silhouettes, atmospheric premium editorial illustration, no text, no people, horizontal composition",
  },
  {
    slug: "new-york-watercolor",
    prompt:
      "A refined tonal watercolor skyline of New York City, soft ivory sky, muted slate blue and warm stone palette, elegant painterly wash, subtle Manhattan skyline with One World Trade and bridge silhouette, atmospheric premium editorial illustration, no text, no people, horizontal composition",
  },
];

function decodeDataUrl(dataUrl) {
  const match = dataUrl.match(/^data:(image\/png|image\/jpeg);base64,(.+)$/);
  if (!match) throw new Error("Unexpected image payload format");
  return Buffer.from(match[2], "base64");
}

async function generateCity(city, index) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://www.keepsy.store",
      "x-visitor-id": `gateway-cities-${index + 1}-${city.slug}`,
    },
    body: JSON.stringify({
      prompt: city.prompt,
      designShape: "landscape",
    }),
  });

  const data = await response.json();
  if (!response.ok || !data?.imageDataUrl) {
    throw new Error(`${city.slug}: ${data?.error || "generation failed"}`);
  }

  const imageBuffer = decodeDataUrl(data.imageDataUrl);
  const filePath = join(OUT_DIR, `${city.slug}.png`);
  await writeFile(filePath, imageBuffer);
  console.log(`saved ${filePath}`);
}

await mkdir(OUT_DIR, { recursive: true });

for (const [index, city] of CITIES.entries()) {
  await generateCity(city, index);
}
