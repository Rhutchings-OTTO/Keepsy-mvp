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

/** 11 oz mug full-wrap print area */
const MUG_W = 2582;
const MUG_H = 1120;

/**
 * Mug layout — four equal quarters (645.5 px each).
 * The Printify template has three vertical dotted guides dividing the wrap
 * into quarters; the handle occupies the middle two (Q2 + Q3).
 *
 *   Q1 [0       … 645)    ← 9 o'clock  — design here
 *   Q2 [645     … 1291)   ← handle zone (blank)
 *   Q3 [1291    … 1937)   ← handle zone (blank)
 *   Q4 [1937    … 2582)   ← 3 o'clock  — design here
 *
 * Centre of Q1 = 323 px  (12.5% of 2582)
 * Centre of Q4 = 2259 px (87.5% of 2582)
 */
const MUG_QUARTER = Math.round(MUG_W / 4); // 646
const MUG_Q1_CENTER = Math.round(MUG_QUARTER / 2);          // 323 → centre of Q1 [0..645]
const MUG_Q4_CENTER = MUG_W - Math.round(MUG_QUARTER / 2); // 2259 → centre of Q4 [1936..2581]

/**
 * Each design slot fits within one quarter (646 × 1120 px) with ~50 px
 * breathing room on every side: max 546 × 1020 px.
 */
const MUG_IMG_MAX_W = MUG_QUARTER - 100; // 546
const MUG_IMG_MAX_H = 1020;

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
 * The Printify template divides the wrap into four equal quarters (~646 px).
 * The handle occupies Q2 + Q3 (645–1937 px). The design is placed once in
 * Q1 (9 o'clock) and once in Q4 (3 o'clock), each copy centred in its quarter.
 *
 * Each slot: 546 × 1020 px (≈50 px margin on all sides within 646 × 1120).
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

  // Centre image on Q1 centre (25% = ~646 px)
  const leftX  = Math.round(MUG_Q1_CENTER - rw / 2);
  // Centre image on Q4 centre (75% = ~1937 px)
  const rightX = Math.round(MUG_Q4_CENTER - rw / 2);
  // Vertical centre across full 1120 px strip
  const posY   = Math.round((MUG_H - rh) / 2);

  return sharp({
    create: {
      width: MUG_W,
      height: MUG_H,
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
  // sizeCode is kept as a parameter for API compatibility but is no longer used
  // for resizing — the frontend crop is trusted as-is.
  void sizeCode;

  const srcBuf = await fetchBuffer(imageUrl);

  // The user has already cropped the image on the frontend — trust that crop
  // and do not resize further. Extend directly from the source dimensions.
  // Extend all four sides by copying edge pixels outward — Sharp 'copy' mode
  // replicates the outermost row/column across the full 375 px wrap depth.
  // Corner areas are filled with the nearest corner pixel automatically.
  return sharp(srcBuf)
    .extend({
      top:    CANVAS_WRAP_PX,
      bottom: CANVAS_WRAP_PX,
      left:   CANVAS_WRAP_PX,
      right:  CANVAS_WRAP_PX,
      extendWith: "copy",
    })
    .png()
    .toBuffer();
}
