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
 * Greeting card print area — landscape sheet that folds in half vertically.
 *
 *   Left half  [0–1500 px]:  inside-left panel (branding)
 *   Right half [1500–3000 px]: front cover (AI image)
 *
 * Content in both halves is rotated 90° CCW so it appears upright once the
 * card is folded and held in portrait orientation.
 */
const CARD_W      = 3000;
const CARD_H      = 2102;
const CARD_HALF_W = CARD_W / 2; // 1500 — width of each panel

/** Front-cover safe zone: 80% of the right half. */
const COVER_SAFE_W = Math.round(CARD_HALF_W * 0.8); // 1200
const COVER_SAFE_H = Math.round(CARD_H       * 0.8); // 1682

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
 * Card: composite the AI image and branding onto a white 3000 × 2102 canvas.
 *
 * The print area is a landscape sheet that folds in half vertically:
 *   • Right half [1500–3000 px] = front cover
 *     - AI image rotated 90° CCW, contain-fitted to 80% of the 1500×2102 panel,
 *       centred in the right half. Appears upright in portrait once folded.
 *   • Left half [0–1500 px] = inside-left panel
 *     - Subtle "made with / Keepsy.store" branding, also rotated 90° CCW.
 *
 * Returns a PNG Buffer for upload to Printify at scale:1.0 / position:0.5,0.5.
 */
export async function compositeCardImage(imageUrl: string): Promise<Buffer> {
  const srcBuf = await fetchBuffer(imageUrl);

  // ── Front cover: rotate 90° CCW then contain-fit within safe zone ────────────
  const rotated = await sharp(srcBuf).rotate(-90).png().toBuffer();

  const resized = await sharp(rotated)
    .resize(COVER_SAFE_W, COVER_SAFE_H, { fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();

  const { width: rw = COVER_SAFE_W, height: rh = COVER_SAFE_H } = await sharp(resized).metadata();

  // Centre within the right half (x: CARD_HALF_W → CARD_W, y: 0 → CARD_H)
  const imageLeft = CARD_HALF_W + Math.round((CARD_HALF_W - rw) / 2);
  const imageTop  = Math.round((CARD_H - rh) / 2);

  // ── Inside-left panel: branding SVG rotated 90° CCW ──────────────────────────
  // "Georgia, serif" is used for Keepsy (serif brand font, reliable in librsvg).
  // "Arial, sans-serif" for body text (matches site sans-serif).
  const FONT_BODY  = 42;  // "made with" and ".store" (~10pt at 300 DPI)
  const FONT_BRAND = 52;  // "Keepsy" — ~24% larger (~12.5pt at 300 DPI)
  const TEXT_COLOR = "#AAAAAA";
  const cx = CARD_HALF_W / 2; // 750 — horizontal centre of left half
  const cy = CARD_H / 2;      // 1051 — vertical centre

  // Both lines centred around the rotated origin; baselines spaced ~90 px apart.
  // After 90° CCW rotation these y-offsets become the x-spread, so spacing looks
  // like comfortable leading when the card is held upright.
  const brandingSvg = Buffer.from(
    `<svg width="${CARD_HALF_W}" height="${CARD_H}" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(${cx},${cy}) rotate(-90)">
        <text x="0" y="-45"
          text-anchor="middle"
          font-family="Arial, Helvetica, sans-serif"
          font-size="${FONT_BODY}"
          font-weight="400"
          letter-spacing="3"
          fill="${TEXT_COLOR}"
        >made with</text>
        <text x="0" y="47"
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
      </g>
    </svg>`
  );

  return sharp({
    create: {
      width: CARD_W,
      height: CARD_H,
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
