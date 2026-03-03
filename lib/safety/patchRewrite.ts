/**
 * Patch-based surgical rewriting. Only modifies risky fragments; preserves user intent.
 */

export type Patch = { from: string; to: string };

/** Minimal suffix—only when IP keyword was present */
const IP_SUFFIX = " Create an original scene without using copyrighted characters or logos.";

/** Patterns: match risky fragment, replace with safe equivalent. Order matters. */
const PATCH_PATTERNS: Array<{ pattern: RegExp; replacement: string; flags?: string }> = [
  { pattern: /\(think\s+leo\s+in\s+the\s+great\s+gatsby\)/gi, replacement: "(a charismatic, classic 1920s art-deco party host vibe)" },
  { pattern: /\(think\s+leo\s+.*?gatsby\)/gi, replacement: "(a charismatic 1920s art-deco vibe)" },
  { pattern: /\bthink\s+leo\s+in\s+the\s+great\s+gatsby\b/gi, replacement: "a charismatic, classic 1920s art-deco party host vibe" },
  { pattern: /\bgreat\s+gatsby\b/gi, replacement: "1920s art-deco jazz age champagne party vibe" },
  { pattern: /\bthe\s+great\s+gatsby\b/gi, replacement: "1920s art-deco jazz age vibe" },
  { pattern: /\(think\s+[a-z\s]+\)/gi, replacement: "(a charismatic, classic 1920s party host vibe)" },
  { pattern: /\blike\s+(?:leo|leonardo|dicaprio|taylor|swift|beyonce|trump|biden|obama|putin|elon|musk|drake|kanye|rihanna|kim\s+kardashian)\b[^.]*/gi, replacement: "a charismatic, classic party host vibe" },
  { pattern: /\bin\s+the\s+style\s+of\s+[^.!,?]+/gi, replacement: "inspired by modern animation" },
  { pattern: /\bthink\s+[a-z]+(?:\s+[a-z]+)?\s+in\s+[a-z\s]+/gi, replacement: "a classic vintage party vibe" },
];

const SIMILARITY_THRESHOLD = 0.75;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Token overlap ratio: intersection size / union size (Jaccard-like). */
function tokenOverlapRatio(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  if (union === 0) return 1;
  return intersection / union;
}

/**
 * Apply patch patterns surgically. Returns patched text and list of applied patches.
 */
export function applyPatches(input: string): { patched: string; patches: Patch[] } {
  let result = input;
  const patches: Patch[] = [];

  for (const { pattern, replacement } of PATCH_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags ?? "gi");
    const match = result.match(regex);
    if (match) {
      const from = match[0];
      const to = replacement;
      result = result.replace(regex, to);
      patches.push({ from, to });
    }
  }

  return { patched: result.trim(), patches };
}

/**
 * Compute similarity between original and patched prompt (token overlap).
 */
export function computeSimilarity(original: string, patched: string): number {
  const tokensOrig = tokenize(original);
  const tokensPatched = tokenize(patched);
  return tokenOverlapRatio(tokensOrig, tokensPatched);
}

/**
 * Optionally append IP suffix only when an IP-related patch was applied.
 */
export function maybeAddIPSuffix(patched: string, hadIPKeyword: boolean): string {
  if (!hadIPKeyword) return patched;
  if (patched.endsWith(".")) return patched + IP_SUFFIX;
  return patched + "." + IP_SUFFIX;
}

export { SIMILARITY_THRESHOLD };
