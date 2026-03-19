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

/** 11 oz mug full-wrap print area */
const MUG_W = 2582;
const MUG_H = 1120;

/**
 * Mug layout — three equal-ish vertical zones:
 *   Left  [0       … 860)    ← design here
 *   Handle[860     … 1722)   ← blank
 *   Right [1722    … 2582)   ← design here (mirrored)
 */
const MUG_SIDE_W = 860;
const MUG_RIGHT_START = MUG_W - MUG_SIDE_W; // 1722

/**
 * Each design slot is 760 × 1020 px, giving ~50 px breathing room
 * on every side within the 860 × 1120 zone.
 */
const MUG_IMG_MAX_W = 760;
const MUG_IMG_MAX_H = 1020;

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
 * Mug: composite the AI image TWICE on a white 2582 × 1120 full-wrap canvas.
 *
 * The mug handle sits in the centre zone (860–1722 px). The design is placed
 * once in the left zone and once in the right zone so it appears on both
 * sides of the handle.
 *
 * Each slot: 760 × 1020 px (≈50 px margin on all sides within 860 × 1120).
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

  // Centre image within left zone  [0, 860)
  const leftX  = Math.round((MUG_SIDE_W - rw) / 2);
  // Centre image within right zone [1722, 2582)
  const rightX = MUG_RIGHT_START + Math.round((MUG_SIDE_W - rw) / 2);
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
