/**
 * Keepsy Artistic Director — transforms user prompts into high-end, printable masterpieces.
 * Applied to every generation before the API call.
 */

/** Maximum chars added by artistic direction. Keep concise for API limits. */
const DIRECTION_MAX_CHARS = 280;

/**
 * Artistic direction block applied to every prompt.
 * - Print Optimization: bold lines, saturated colors, clear contrast
 * - Aesthetic Filter: artisanal quality (oil, acrylic, screen-print, vector)
 * - Background Control: isolated subjects, clean backgrounds, elegant vignettes
 * - Forbidden: no clipart, blurry gradients, generic AI plastic look
 * - Keepsy Touch: modern heritage, timeless, gallery-ready
 */
const KEEPSY_DIRECTION = ` Print-optimized: bold lines (2pt minimum), saturated colors, clear contrast. Artisanal quality—oil on canvas, thick acrylic, screen-print, or minimalist vector. Isolated subject on clean solid background or elegant vignette. No clipart, blurry gradients, or generic AI plastic look. Modern heritage, gallery-ready.`;

/**
 * Shorter variant for edit mode (user uploaded image) — less intrusive.
 */
const KEEPSY_DIRECTION_EDIT = ` Print-ready: bold saturated colors, artisanal texture. Clean edges, no blurry gradients. Modern heritage, gallery-quality.`;

export type ApplyArtisticDirectionInput = {
  userPrompt: string;
  mode: "describe" | "upload";
  maxTotalLength?: number;
};

/**
 * Applies the Keepsy Artistic Director rules to the user prompt.
 * Returns the enhanced prompt ready for the image generation API.
 */
export function applyArtisticDirection(input: ApplyArtisticDirectionInput): string {
  const { userPrompt, mode, maxTotalLength = 1000 } = input;
  const direction = mode === "upload" ? KEEPSY_DIRECTION_EDIT : KEEPSY_DIRECTION;
  const directionTrimmed = direction.slice(0, DIRECTION_MAX_CHARS);
  const combined = `${userPrompt.trim()}${directionTrimmed}`;
  return combined.slice(0, maxTotalLength);
}
