import OpenAI from "openai";
import https from "https";
import http from "http";
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

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(dest);
    proto.get(url, (res) => {
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log("Generating image with DALL-E 3...");
  const response = await client.images.generate({
    model: "dall-e-3",
    prompt: PROMPT,
    size: "1792x1024",
    quality: "hd",
    style: "natural",
    n: 1,
  });

  const url = response.data[0].url;
  console.log("Image generated. Downloading...");
  await download(url, OUTPUT_PATH);
  console.log(`Saved to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
