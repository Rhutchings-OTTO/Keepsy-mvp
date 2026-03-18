/**
 * Server-side image compositing for Printify print areas.
 *
 * All functions return PNG Buffers ready to pass directly to
 * uploadImageToPrintify(). Composited images are uploaded at scale:1.0
 * so every pixel maps exactly to the print area — no Printify-side scaling.
 */

import sharp from "sharp";

// ── Print area constants (pixels at 300 DPI) ──────────────────────────────────

/** Greeting card print area */
const CARD_W = 3000;
const CARD_H = 2102;

/**
 * Card safe zone: 80% of print area.
 * Gives ~300 px white border on left/right and ~210 px on top/bottom.
 */
const CARD_SAFE_W = Math.round(CARD_W * 0.8); // 2400
const CARD_SAFE_H = Math.round(CARD_H * 0.8); // 1682

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
 * Card: composite the AI image onto a white 3000 × 2102 canvas.
 *
 * The image is contain-fitted to 80% of the print area (2400 × 1682) and
 * centred, leaving a guaranteed white border on all four edges.
 *
 * Returns a PNG Buffer for upload to Printify at scale:1.0 / position:0.5,0.5.
 */
export async function compositeCardImage(imageUrl: string): Promise<Buffer> {
  const srcBuf = await fetchBuffer(imageUrl);

  const resized = await sharp(srcBuf)
    .resize(CARD_SAFE_W, CARD_SAFE_H, { fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();

  const { width: rw = CARD_SAFE_W, height: rh = CARD_SAFE_H } = await sharp(resized).metadata();

  const left = Math.round((CARD_W - rw) / 2);
  const top  = Math.round((CARD_H - rh) / 2);

  return sharp({
    create: {
      width: CARD_W,
      height: CARD_H,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([{ input: resized, left, top }])
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
