import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "public", "generated-examples");
const API_URL = "https://www.keepsy.store/api/generate-image";

const EXAMPLES = [
  {
    slug: "family-caricature",
    prompt:
      "A warm, premium cartoon caricature portrait of a smiling family of four on a sofa, tasteful hand-painted detail, soft neutrals, elegant keepsake illustration, clean ivory background",
  },
  {
    slug: "house-christmas",
    prompt:
      "A premium painted Christmas house portrait with wreaths, glowing windows, snowy path, tasteful festive details, elegant greeting card artwork, clean composition",
  },
  {
    slug: "pet-watercolor",
    prompt:
      "A refined watercolor portrait of a golden retriever with a sage green ribbon collar, soft neutral background, premium keepsake artwork, elegant brush texture",
  },
  {
    slug: "birthday-floral",
    prompt:
      "A luxury floral birthday illustration with peonies, ranunculus, silk ribbon, subtle gold accents, blush and cream palette, premium greeting card artwork",
  },
  {
    slug: "thanksgiving-tablescape",
    prompt:
      "A warm Thanksgiving tablescape illustration with pumpkins, candles, autumn leaves and place settings, painterly premium mug artwork, inviting family feel",
  },
  {
    slug: "mothers-day-bouquet",
    prompt:
      "A premium Mother's Day bouquet illustration with garden roses, sweet peas and soft peach florals, elegant hand-painted detail, clean ivory background",
  },
  {
    slug: "anniversary-line-art",
    prompt:
      "A refined anniversary line art portrait of a couple holding hands, warm stone and blush palette, premium minimalist greeting card artwork",
  },
  {
    slug: "fourth-july-garden",
    prompt:
      "A polished Fourth of July backyard celebration illustration with bunting, children, string lights and subtle fireworks, premium t-shirt artwork, clean composition",
  },
];

function decodeDataUrl(dataUrl) {
  const match = dataUrl.match(/^data:(image\/png|image\/jpeg);base64,(.+)$/);
  if (!match) {
    throw new Error("Unexpected image payload format");
  }
  return Buffer.from(match[2], "base64");
}

async function generateExample(example, index) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://www.keepsy.store",
      "x-visitor-id": `examples-build-${index + 1}-${example.slug}`,
    },
    body: JSON.stringify({
      prompt: example.prompt,
      designShape: "square",
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`${example.slug}: ${data?.error || "generation failed"}`);
  }

  const imageBuffer = decodeDataUrl(data.imageDataUrl);
  const filePath = join(OUT_DIR, `${example.slug}.png`);
  await writeFile(filePath, imageBuffer);
  return filePath;
}

await mkdir(OUT_DIR, { recursive: true });

for (const [index, example] of EXAMPLES.entries()) {
  const filePath = await generateExample(example, index);
  console.log(`saved ${filePath}`);
}
