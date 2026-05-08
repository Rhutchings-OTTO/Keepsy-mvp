import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("OPENAI_API_KEY not set");
  process.exit(1);
}

const client = new OpenAI({ apiKey });

const PROMPT =
  "A blonde mother and her young daughter walking through a sunlit park, laughing together, candid and natural, photographed from a medium distance showing full bodies with surrounding park scenery, warm golden hour lighting, soft bokeh background with green trees, cream and warm tones, shallow depth of field, lifestyle photography style, hyper realistic, shot on 85mm lens, no posing, genuine joy and connection between them";

const OUTPUT_PATH = path.join(__dirname, "../public/images/our-story-hero.png");

async function main() {
  const model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
  const isDalle = model.startsWith("dall-e");
  console.log(`Generating image with ${model}...`);

  const params = isDalle
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

  const response = await client.images.generate(params);

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    console.error("No image data returned");
    process.exit(1);
  }

  await fs.promises.writeFile(OUTPUT_PATH, Buffer.from(b64, "base64"));
  console.log(`Saved to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
