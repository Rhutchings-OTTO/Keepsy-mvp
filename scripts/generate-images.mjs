/**
 * Directly calls OpenAI gpt-image-1 (or dall-e-3) to generate all 22 lifestyle images
 * and saves them to public/images/ subdirectories.
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
    const m = line.match(/^([A-Z_]+)="?(.+?)"?$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY not found");
  process.exit(1);
}

const IMAGES = [
  // Hero section (A1-A3) — only 3 hero images from the spec
  {
    id: "A1",
    file: "public/images/hero/mug-hero.jpg",
    prompt: "Cream ceramic mug on sunlit kitchen counter, adorable watercolour golden retriever portrait painted on the mug in warm painterly brushstrokes, woman's hand gently holding handle, morning light streaming from left, wildflowers blurred in background, warm cream and terracotta tones, lifestyle product photography 45-degree angle shallow depth of field, premium gift photography",
  },
  {
    id: "A2",
    file: "public/images/hero/cards-hero.jpg",
    prompt: "Set of premium personalised greeting cards arranged on marble surface, front card shows soft watercolour floral bouquet in pinks creams sage greens, gold pen and eucalyptus sprig styled beside them, soft natural window light from above, overhead shot slight angle, elegant premium stationery photography, warm cream and blush palette",
  },
  {
    id: "A3",
    file: "public/images/hero/tee-hero.jpg",
    prompt: "White personalised t-shirt premium lifestyle flat-lay on warm wooden surface, charming cartoon family portrait print showing mom dad two kids and dog in colourful illustrated style, styled with sunglasses coffee cup small succulent, bright clean natural overhead light, warm wooden tones, directly above shot",
  },
  // Featured products (B1-B4)
  {
    id: "B1",
    file: "public/images/featured/mom-mug.jpg",
    prompt: "Beautiful cream ceramic mug centred on styled surface, watercolour illustration of pink peonies and greenery wrapping around the mug in gorgeous painted style, small saucer with spoon beside it, warm cream background soft natural side lighting, tight product shot showing full floral design, premium gift mug photography, warm and feminine",
  },
  {
    id: "B2",
    file: "public/images/featured/card-pack.jpg",
    prompt: "Pack of 5 personalised greeting cards laid out in overlapping fan arrangement on linen surface, cards showing different styles - watercolour landscape, illustrated pet portrait, floral design, family illustration, premium thick cardstock visible from edges, cream ribbon and small dried flower bunch beside them, soft warm overhead light, premium stationery photography",
  },
  {
    id: "B3",
    file: "public/images/featured/grandma-hoodie.jpg",
    prompt: "Cream white hoodie folded neatly on cozy bed with plush blankets and pillows, watercolour portrait of grandmother and young girl holding hands illustrated on the hoodie in sweet painted style, warm bedroom setting with candle on nightstand, soft diffused light, 45-degree angle lifestyle photography, heartwarming sentimental gift, warm cream blush tones",
  },
  {
    id: "B4",
    file: "public/images/featured/family-tee.jpg",
    prompt: "White t-shirt on wooden hanger against warm cream wall, delightful custom illustrated family portrait print showing parents kids and a pet in fun modern cartoon style with warm colours, small potted plant on shelf beside it, clean warm studio lighting, straight-on product shot, fun personalised family gift photography",
  },
  // Products catalog (C1-C8)
  {
    id: "C1",
    file: "public/images/products/greeting-card.jpg",
    prompt: "Premium greeting cards fanned on marble surface, front card shows soft watercolour floral bouquet in pinks and creams, fresh peonies and gold pen styled beside, soft natural window light, overhead at slight angle shallow depth of field, warm elegant feminine stationery photography",
  },
  {
    id: "C2",
    file: "public/images/products/mug.jpg",
    prompt: "Cream ceramic mug on sunlit kitchen counter, cute illustrated golden retriever portrait design on mug, cozy kitchen morning light, croissant on plate linen napkin beside it, golden morning light 45-degree angle, cozy everyday luxury product photography",
  },
  {
    id: "C3",
    file: "public/images/products/tshirt-white.jpg",
    prompt: "White t-shirt flat-lay on warm wood surface, charming cartoon family portrait print showing mom dad kids dog, succulent and sunglasses styled nearby, bright clean overhead light, directly above shot, fun modern family personalised gift photography",
  },
  {
    id: "C4",
    file: "public/images/products/tshirt-black.jpg",
    prompt: "Black t-shirt on wooden hanger against cream backdrop, beautiful watercolour tabby cat portrait print on the shirt, eucalyptus sprig minimal styling, soft warm studio light, straight-on shot, premium artistic pet lover gift photography",
  },
  {
    id: "C5",
    file: "public/images/products/hoodie-white.jpg",
    prompt: "White hoodie folded on bed with cozy blankets, watercolour grandmother and granddaughter holding hands print on hoodie, bedroom with candle and reading glasses, soft warm diffused light, 45-degree lifestyle photography, sentimental cozy heartwarming gift",
  },
  {
    id: "C6",
    file: "public/images/products/hoodie-black.jpg",
    prompt: "Person wearing black hoodie chest-down showing print, adorable golden doodle portrait design in tiny red cape on the hoodie, autumn outdoor setting golden leaves, golden hour backlighting medium shot bokeh background, fun playful pet-obsessed gift photography",
  },
  {
    id: "C7",
    file: "public/images/products/tshirt-blue.jpg",
    prompt: "Blue t-shirt flat-lay on white marble surface, minimal coordinates design with small heart on the shirt, coffee cup fresh flowers and polaroid photos styled nearby, bright airy light overhead, meaningful romantic minimal gift photography",
  },
  {
    id: "C8",
    file: "public/images/products/hoodie-blue.jpg",
    prompt: "Blue hoodie on rustic wooden hook, watercolour beach sunset design on the hoodie, beach house entry setting with flip-flops and straw hat nearby, late afternoon golden glow, lifestyle angle shot, nostalgic vacation memories gift photography",
  },
  // Occasions (D1-D7)
  {
    id: "D1",
    file: "public/images/occasions/mothers-day.jpg",
    prompt: "Personalised mug and greeting card on breakfast tray, mug shows watercolour mother and daughter portrait, pink flowers croissant and orange juice on the tray, soft morning light through sheer curtains, pink and cream tones, tender heartwarming Mother's Day gift photography",
  },
  {
    id: "D2",
    file: "public/images/occasions/christmas.jpg",
    prompt: "Personalised hoodie and mug under Christmas tree with fairy lights and wrapped presents, hoodie shows illustrated family portrait in holiday style, warm golden fairy light glow, magical festive family warmth, Christmas morning gift photography",
  },
  {
    id: "D3",
    file: "public/images/occasions/thanksgiving.jpg",
    prompt: "Personalised greeting card on autumn dinner table, card shows watercolour family home with fall foliage, pumpkins candles and autumn leaves as table decoration, warm candlelight and amber sunlight, gratitude harvest warmth Thanksgiving gift photography",
  },
  {
    id: "D4",
    file: "public/images/occasions/fourth-of-july.jpg",
    prompt: "Personalised white t-shirt on porch railing, fun illustrated family portrait with patriotic theme on the shirt, small American flags and sparklers in background, bright summer sunshine, cheerful all-American family celebration photography",
  },
  {
    id: "D5",
    file: "public/images/occasions/birthday.jpg",
    prompt: "Personalised mug being unwrapped from tissue paper, cartoon woman portrait design with party hat on the mug, confetti ribbon and birthday candles nearby, bright warm light, joyful surprise birthday gift moment photography",
  },
  {
    id: "D6",
    file: "public/images/occasions/anniversary.jpg",
    prompt: "Personalised greeting card on candlelit dinner table set for two, watercolour couple portrait on the card, wine glasses and red roses and white linens, romantic warm candlelight glow, timeless romantic anniversary gift photography",
  },
  {
    id: "D7",
    file: "public/images/occasions/pet-gifts.jpg",
    prompt: "Personalised mug and t-shirt on cozy couch, mug has realistic French bulldog portrait painted on it, t-shirt has cartoon bulldog version in sunglasses, actual French bulldog sitting proudly next to the products, warm cozy living room lighting, heartwarming funny irresistible pet gift photography",
  },
];

async function generateImage(prompt, outputPath, id) {
  console.log(`\n[${id}] Generating: ${outputPath}`);

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      output_format: "jpeg",
      quality: "medium",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    // Try fallback to dall-e-3
    console.log(`  [${id}] gpt-image-1 failed (${response.status}), trying dall-e-3...`);
    return await generateWithDalle3(prompt, outputPath, id);
  }

  const data = await response.json();

  if (data.error) {
    console.log(`  [${id}] Error: ${data.error.message}`);
    return false;
  }

  // gpt-image-1 returns b64_json
  const imageData = data.data?.[0];
  if (!imageData) {
    console.log(`  [${id}] No image data in response`);
    return false;
  }

  // Could be b64_json or url
  if (imageData.b64_json) {
    const buffer = Buffer.from(imageData.b64_json, "base64");
    const fullPath = path.join(ROOT, outputPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, buffer);
    console.log(`  [${id}] Saved ${buffer.length} bytes to ${outputPath}`);
    return true;
  } else if (imageData.url) {
    // Download the URL
    const imgResponse = await fetch(imageData.url);
    const buffer = Buffer.from(await imgResponse.arrayBuffer());
    const fullPath = path.join(ROOT, outputPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, buffer);
    console.log(`  [${id}] Downloaded and saved ${buffer.length} bytes to ${outputPath}`);
    return true;
  }

  console.log(`  [${id}] Unknown response format:`, JSON.stringify(imageData).slice(0, 200));
  return false;
}

async function generateWithDalle3(prompt, outputPath, id) {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: prompt.slice(0, 4000),
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
      quality: "standard",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log(`  [${id}] dall-e-3 also failed (${response.status}): ${errorText.slice(0, 200)}`);
    return false;
  }

  const data = await response.json();
  if (data.error) {
    console.log(`  [${id}] dall-e-3 error: ${data.error.message}`);
    return false;
  }

  const imageData = data.data?.[0];
  if (!imageData) {
    console.log(`  [${id}] No image data from dall-e-3`);
    return false;
  }

  if (imageData.b64_json) {
    const buffer = Buffer.from(imageData.b64_json, "base64");
    const fullPath = path.join(ROOT, outputPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, buffer);
    console.log(`  [${id}] [dall-e-3] Saved ${buffer.length} bytes to ${outputPath}`);
    return true;
  } else if (imageData.url) {
    const imgResponse = await fetch(imageData.url);
    const buffer = Buffer.from(await imgResponse.arrayBuffer());
    const fullPath = path.join(ROOT, outputPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, buffer);
    console.log(`  [${id}] [dall-e-3] Downloaded and saved ${buffer.length} bytes to ${outputPath}`);
    return true;
  }

  return false;
}

async function main() {
  console.log(`Generating ${IMAGES.length} images...`);

  const results = { success: [], failed: [] };

  for (const img of IMAGES) {
    try {
      const ok = await generateImage(img.prompt, img.file, img.id);
      if (ok) {
        results.success.push(img.id);
      } else {
        results.failed.push(img.id);
      }
    } catch (err) {
      console.error(`  [${img.id}] Exception: ${err.message}`);
      results.failed.push(img.id);
    }

    // Small delay between requests to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  console.log("\n=== RESULTS ===");
  console.log(`Success (${results.success.length}): ${results.success.join(", ")}`);
  console.log(`Failed (${results.failed.length}): ${results.failed.join(", ")}`);
}

main().catch(console.error);
