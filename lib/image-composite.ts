/**
 * Server-side image compositing for Printify print areas.
 *
 * All functions return PNG Buffers ready to pass directly to
 * uploadImageToPrintify(). Composited images are uploaded at scale:1.0
 * so every pixel maps exactly to the print area — no Printify-side scaling.
 */

import sharp from "sharp";

// ── Print area constants (pixels at 300 DPI) ──────────────────────────────────

/**
 * Fine Art Postcard (Blueprint 842, Prodigi) — landscape, 1854 × 1264 px.
 * AI image is placed in landscape orientation centred on a white canvas,
 * contained within 80% of the full dimensions (safe zone).
 */
const POSTCARD_W      = 1854;
const POSTCARD_H      = 1264;
const POSTCARD_SAFE_W = Math.round(POSTCARD_W * 0.80); // 1483
const POSTCARD_SAFE_H = Math.round(POSTCARD_H * 0.80); // 1011

/**
 * Greeting Card Bundle (Blueprint 524, Print Pigeons) — 2409 × 1819 px flat.
 * The canvas is laid out with the FOLD LINE running vertically down the centre:
 *
 *   Left half  [0 – HALF_W):   inside-left panel (branding, portrait)
 *   Right half [HALF_W – W):   front cover (AI image, portrait)
 *
 * Both halves are read top-to-bottom in portrait orientation — NO rotation needed.
 */
const CARDPACK_W      = 2409;
const CARDPACK_H      = 1819;
const CARDPACK_HALF_W = Math.round(CARDPACK_W / 2); // 1204 — each panel width
const CARDPACK_PANEL_W = CARDPACK_W - CARDPACK_HALF_W; // 1205

/** Front-cover safe zone: 80% of the right half */
const COVER_SAFE_W = Math.round(CARDPACK_PANEL_W * 0.80); // 964
const COVER_SAFE_H = Math.round(CARDPACK_H       * 0.80); // 1455

/**
 * US Greeting Card (Blueprint 1094) — 2175 × 1538 px landscape flat.
 * Layout (same fold logic as cardpack):
 *
 *   Left half  [0 – HALF_W):   inside-left panel (Keepsy branding)
 *   Right half [HALF_W – W):   front cover (AI image)
 *
 * Both halves read top-to-bottom. Upload to Printify at scale:1.0.
 */
const USCARD_W       = 2175;
const USCARD_H       = 1538;
const USCARD_HALF_W  = Math.round(USCARD_W / 2); // 1087
const USCARD_PANEL_W = USCARD_W - USCARD_HALF_W; // 1088

/** Front-cover safe zone: 80% of the right half */
const USCARD_COVER_SAFE_W = Math.round(USCARD_PANEL_W * 0.80); // 870
const USCARD_COVER_SAFE_H = Math.round(USCARD_H * 0.80);       // 1230

/**
 * Mug print area — 11 oz mug full-wrap (Blueprint 167, Printify).
 *
 * !! LOCKED VALUES — derived from the Printify template guide lines. !!
 * !! Do NOT change without re-measuring the template.                 !!
 *
 * Full wrap: 2582 × 1120 px at 300 DPI.
 *
 * Face layout:
 *   Front face centre: x = 525  (face spans roughly 0 – 1050 px)
 *   Handle zone:       x ≈ 1050 – 1532 px (no design placed here)
 *   Back face centre:  x = 2057 (face spans roughly 1532 – 2582 px)
 *
 * Vertical safe zone: 28 px margin top and bottom → images must stay within
 *   y = 28 (MUG_TOP_LIMIT) to y = 1092 (MUG_BOTTOM_LIMIT).
 *   Maximum image height: 1064 px (MUG_MAX_HEIGHT).
 *
 * Images are sized to fill ≈80% of the face width (840 px) and up to
 * 100% of the max height (1064 px); the taller constraint wins for most
 * landscape images, the wider for portrait/square images.
 */

// ── Print area (locked) ──────────────────────────────────────────────────────
const MUG_WRAP_W = 2582;
const MUG_WRAP_H = 1120;

// ── Face centres (locked — from Printify template guide lines) ───────────────
const MUG_FRONT_CENTER_X = 525;   // front face centre, px from left
const MUG_BACK_CENTER_X  = 2057;  // back face centre,  px from left
const MUG_CENTER_Y       = Math.round(MUG_WRAP_H / 2); // 560 — vertical midpoint

// ── Vertical hard limits (locked) ────────────────────────────────────────────
const MUG_TOP_LIMIT    = 28;                                  // no design above this row
const MUG_BOTTOM_LIMIT = MUG_WRAP_H - 28;                    // no design below this row (1092)
const MUG_MAX_HEIGHT   = MUG_BOTTOM_LIMIT - MUG_TOP_LIMIT;   // 1064 px

// ── Image size limits (locked) ────────────────────────────────────────────────
const MUG_IMG_MAX_W = 840;          // ≈80% of ~1050 px face width
const MUG_IMG_MAX_H = MUG_MAX_HEIGHT; // hard vertical limit (1064 px)

// Legacy aliases kept so nothing else in this file needs renaming
const MUG_W = MUG_WRAP_W;
const MUG_H = MUG_WRAP_H;
const MUG_Q1_CENTER = MUG_FRONT_CENTER_X;
const MUG_Q4_CENTER = MUG_BACK_CENTER_X;

/**
 * Canvas gallery-wrap constants.
 *
 * All Keepsy canvas products use a 1.25" gallery-wrap depth (Jondo provider).
 * At 300 DPI: 1.25 × 300 = 375 px of wrap on each side.
 *
 * The compositeCanvasImage function resizes the face image to the exact print
 * face dimensions, then uses Sharp's 'copy' extension to bleed the edge pixels
 * outward into the wrap area — one pixel wide strip repeated across 375 px,
 * producing a smooth, colour-matched gallery wrap on all four sides.
 */
const CANVAS_DPI     = 300;
const CANVAS_WRAP_PX = Math.round(1.25 * CANVAS_DPI); // 375 px per side

// ── T-shirt / Hoodie Printify print area dimensions ───────────────────────────

export const TEE_PRINT_W    = 4500;
export const TEE_PRINT_H    = 5100;
export const HOODIE_PRINT_W = 4500;
export const HOODIE_PRINT_H = 3000;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`[image-composite] Failed to fetch image (${res.status}): ${url}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Compute Printify's `scale` parameter for a contain-fit placement.
 *
 * Printify interprets `scale` as the fraction of the print-area WIDTH that the
 * image occupies; height follows the image's natural aspect ratio.
 *
 * Contain-fit rule: scale up until the image hits either edge first — no
 * cropping, always centred.
 *
 *   scale = min(1.0, (printH × imgW) / (printW × imgH))
 *
 * Examples for a square image (imgW = imgH):
 *   T-shirt  (4500 × 5100): scale = min(1.0, 5100/4500) = 1.0   — hits width
 *   Hoodie   (4500 × 3000): scale = min(1.0, 3000/4500) = 0.667 — hits height
 */
export function computeContainScale(
  imgW: number,
  imgH: number,
  printW: number,
  printH: number
): number {
  if (imgW <= 0 || imgH <= 0) return 1.0;
  return Math.min(1.0, (printH * imgW) / (printW * imgH));
}

/**
 * Fetch the image at `imageUrl`, read its pixel dimensions, and return the
 * Printify contain-scale for the given print area.
 */
export async function getContainScaleFromUrl(
  imageUrl: string,
  printW: number,
  printH: number
): Promise<{ scale: number; buffer: Buffer }> {
  const buffer = await fetchBuffer(imageUrl);
  const { width, height } = await sharp(buffer).metadata();
  if (!width || !height) {
    console.warn("[image-composite] Could not read image dimensions; defaulting scale to 1.0");
    return { scale: 1.0, buffer };
  }
  return { scale: computeContainScale(width, height, printW, printH), buffer };
}

/**
 * Fine Art Postcard (Blueprint 842, Prodigi): composite AI image onto a white
 * 1854 × 1264 px landscape canvas with an 80% safe-zone border.
 *
 * The image is placed in landscape orientation (no rotation), centred, with
 * a white border on all four sides. Upload to Printify at scale:1.0.
 */
export async function compositePostcardImage(imageUrl: string): Promise<Buffer> {
  const srcBuf = await fetchBuffer(imageUrl);

  // Contain-fit AI image within the safe zone
  const resized = await sharp(srcBuf)
    .resize(POSTCARD_SAFE_W, POSTCARD_SAFE_H, { fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();

  const { width: rw = POSTCARD_SAFE_W, height: rh = POSTCARD_SAFE_H } = await sharp(resized).metadata();

  // Centre on full canvas
  const left = Math.round((POSTCARD_W - rw) / 2);
  const top  = Math.round((POSTCARD_H - rh) / 2);

  return sharp({
    create: {
      width: POSTCARD_W,
      height: POSTCARD_H,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toBuffer();
}

/**
 * Greeting Card Bundle (Blueprint 524, Print Pigeons): composite AI image and
 * branding onto a white 2409 × 1819 px canvas (laid flat).
 *
 *   Right half [HALF_W – W]: front cover — AI image in portrait orientation,
 *     contain-fitted to 80% of the 1205 × 1819 panel, centred.
 *   Left half  [0 – HALF_W]: inside-left — "made with / Keepsy.store" branding,
 *     centred in portrait orientation (reading top-to-bottom; no rotation needed).
 *
 * Both halves face the same direction. Upload to Printify at scale:1.0.
 */
export async function compositeCardpackImage(imageUrl: string): Promise<Buffer> {
  const srcBuf = await fetchBuffer(imageUrl);

  // ── Front cover (right half): contain-fit AI image within safe zone ──────────
  const resized = await sharp(srcBuf)
    .resize(COVER_SAFE_W, COVER_SAFE_H, { fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();

  const { width: rw = COVER_SAFE_W, height: rh = COVER_SAFE_H } = await sharp(resized).metadata();

  // Centre within the right half
  const imageLeft = CARDPACK_HALF_W + Math.round((CARDPACK_PANEL_W - rw) / 2);
  const imageTop  = Math.round((CARDPACK_H - rh) / 2);

  // ── Inside-left panel: "made with / Keepsy.store" branding ───────────────────
  // Portrait orientation — no rotation. Text is centred in the left panel.
  // "Georgia, serif" approximates the site's Fraunces serif; "Arial" for body text.
  const FONT_BODY  = 42;  // "made with" and ".store"
  const FONT_BRAND = 52;  // "Keepsy" — ~24% larger
  const TEXT_COLOR = "#AAAAAA";
  const cx = Math.round(CARDPACK_HALF_W / 2); // horizontal centre of left half
  const cy = Math.round(CARDPACK_H / 2);       // vertical centre

  const brandingSvg = Buffer.from(
    `<svg width="${CARDPACK_HALF_W}" height="${CARDPACK_H}" xmlns="http://www.w3.org/2000/svg">
      <text
        x="${cx}" y="${cy - 32}"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${FONT_BODY}"
        font-weight="400"
        letter-spacing="3"
        fill="${TEXT_COLOR}"
      >made with</text>
      <text
        x="${cx}" y="${cy + 36}"
        text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="${FONT_BRAND}"
        font-weight="700"
        fill="${TEXT_COLOR}"
      >Keepsy<tspan
          font-family="Arial, Helvetica, sans-serif"
          font-size="${FONT_BODY}"
          font-weight="400"
        >.store</tspan></text>
    </svg>`
  );

  return sharp({
    create: {
      width: CARDPACK_W,
      height: CARDPACK_H,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([
      { input: resized,     left: imageLeft, top: imageTop },
      { input: brandingSvg, left: 0,         top: 0        },
    ])
    .png()
    .toBuffer();
}

/**
 * US Greeting Card (Blueprint 1094): composite AI image and branding onto a
 * white 2175 × 1538 px canvas (laid flat).
 *
 *   Right half [HALF_W – W]: front cover — AI image, contain-fitted to 80% of
 *     the 1088 × 1538 panel, centred.
 *   Left half  [0 – HALF_W]: inside-left — "made with / Keepsy.store" branding,
 *     centred in portrait orientation.
 *
 * Upload to Printify at scale:1.0.
 */
export async function compositeUSCardImage(imageUrl: string): Promise<Buffer> {
  const srcBuf = await fetchBuffer(imageUrl);

  // ── Front cover (right half): contain-fit AI image within safe zone ──────────
  const resized = await sharp(srcBuf)
    .resize(USCARD_COVER_SAFE_W, USCARD_COVER_SAFE_H, { fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();

  const { width: rw = USCARD_COVER_SAFE_W, height: rh = USCARD_COVER_SAFE_H } = await sharp(resized).metadata();

  // Centre within the right half
  const imageLeft = USCARD_HALF_W + Math.round((USCARD_PANEL_W - rw) / 2);
  const imageTop  = Math.round((USCARD_H - rh) / 2);

  // ── Inside-left panel: "made with / Keepsy.store" branding ───────────────────
  const FONT_BODY  = 36;
  const FONT_BRAND = 44;
  const TEXT_COLOR = "#AAAAAA";
  const cx = Math.round(USCARD_HALF_W / 2);
  const cy = Math.round(USCARD_H / 2);

  const brandingSvg = Buffer.from(
    `<svg width="${USCARD_HALF_W}" height="${USCARD_H}" xmlns="http://www.w3.org/2000/svg">
      <text
        x="${cx}" y="${cy - 26}"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${FONT_BODY}"
        font-weight="400"
        letter-spacing="3"
        fill="${TEXT_COLOR}"
      >made with</text>
      <text
        x="${cx}" y="${cy + 30}"
        text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="${FONT_BRAND}"
        font-weight="700"
        fill="${TEXT_COLOR}"
      >Keepsy<tspan
          font-family="Arial, Helvetica, sans-serif"
          font-size="${FONT_BODY}"
          font-weight="400"
        >.store</tspan></text>
    </svg>`
  );

  return sharp({
    create: {
      width: USCARD_W,
      height: USCARD_H,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([
      { input: resized,     left: imageLeft, top: imageTop },
      { input: brandingSvg, left: 0,         top: 0        },
    ])
    .png()
    .toBuffer();
}

/**
 * Mug: composite the AI image TWICE on a white 2582 × 1120 full-wrap canvas.
 *
 * One copy is centred on the front face (MUG_FRONT_CENTER_X = 525) and one on
 * the back face (MUG_BACK_CENTER_X = 2057). Both copies share the same vertical
 * centre (MUG_CENTER_Y = 560).
 *
 * The image is contain-fitted within MUG_IMG_MAX_W × MUG_IMG_MAX_H (840 × 1064).
 * The vertical clamp guarantees no image pixel falls above MUG_TOP_LIMIT (28 px)
 * or below MUG_BOTTOM_LIMIT (1092 px), regardless of source aspect ratio.
 *
 * Returns a PNG Buffer for upload to Printify at scale:1.0 / position:0.5,0.5.
 */
export async function compositeMugImage(imageUrl: string): Promise<Buffer> {
  const srcBuf = await fetchBuffer(imageUrl);

  const resized = await sharp(srcBuf)
    .resize(MUG_IMG_MAX_W, MUG_IMG_MAX_H, { fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();

  const { width: rw = MUG_IMG_MAX_W, height: rh = MUG_IMG_MAX_H } = await sharp(resized).metadata();

  // Horizontal: centre on each face
  const leftX  = Math.round(MUG_FRONT_CENTER_X - rw / 2);
  const rightX = Math.round(MUG_BACK_CENTER_X  - rw / 2);

  // Vertical: centre on MUG_CENTER_Y, then clamp to hard limits
  const posY = Math.max(
    MUG_TOP_LIMIT,
    Math.min(MUG_BOTTOM_LIMIT - rh, Math.round(MUG_CENTER_Y - rh / 2)),
  );

  return sharp({
    create: {
      width:    MUG_WRAP_W,
      height:   MUG_WRAP_H,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([
      { input: resized, left: leftX,  top: posY },
      { input: resized, left: rightX, top: posY },
    ])
    .png()
    .toBuffer();
}

/**
 * Canvas gallery wrap (Jondo blueprint 1159): resize the AI image to the exact
 * canvas face dimensions and extend all four edges outward by 375 px (1.25" at
 * 300 DPI) using Sharp's 'copy' extension, which replicates a 1 px strip from
 * each edge across the full wrap depth.
 *
 * Layout of the output file:
 *
 *   ┌──────────────────────────────────┐
 *   │   375 px top wrap  (edge bleed)  │
 *   ├──────────────────────────────────┤
 *   │ 375│                        │375 │
 *   │ px │    face (W×H inches    │ px │
 *   │    │     at 300 DPI)        │    │
 *   ├──────────────────────────────────┤
 *   │  375 px bottom wrap (edge bleed) │
 *   └──────────────────────────────────┘
 *
 * sizeCode: canvas face dimensions in inches, e.g. "20x16". The function
 * resizes (cover-fit) the source to faceW × faceH before extending, so the
 * output always has the correct print-area pixel count regardless of input size.
 *
 * Returns a PNG Buffer for upload to Printify at scale:1.0, position:0.5,0.5.
 */
export async function compositeCanvasImage(
  imageUrl: string,
  sizeCode = "20x16",
): Promise<Buffer> {
  const parts = sizeCode.split("x");
  const faceWIn = parseFloat(parts[0] ?? "20");
  const faceHIn = parseFloat(parts[1] ?? "16");

  const srcBuf = await fetchBuffer(imageUrl);

  // Bleed as a proportion of the face: 1.25" / faceInches × imagePixels.
  // This keeps the physical 1.25" wrap depth correct for all canvas sizes —
  // square, landscape, and portrait — at any source pixel count.
  const { width: srcW = 6000, height: srcH = 4800 } = await sharp(srcBuf).metadata();
  const hBleed = Math.round((1.25 / faceWIn) * srcW);
  const vBleed = Math.round((1.25 / faceHIn) * srcH);

  // Extend all four sides by copying edge pixels outward — Sharp 'copy' mode
  // replicates the outermost row/column across the full bleed depth.
  // Corner areas are filled with the nearest corner pixel automatically.
  return sharp(srcBuf)
    .extend({
      top:    vBleed,
      bottom: vBleed,
      left:   hBleed,
      right:  hBleed,
      extendWith: "copy",
    })
    .png()
    .toBuffer();
}
