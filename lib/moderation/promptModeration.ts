/**
 * Content moderation and prompt soft-rewriting.
 * Reduces unnecessary blocks for harmless prompts while staying compliant.
 */

/** Specific copyrighted/trademarked characters - hard block */
const COPYRIGHTED_CHARACTERS = [
  "batman",
  "spider-man",
  "spiderman",
  "superman",
  "wonder woman",
  "iron man",
  "ironman",
  "captain america",
  "thor",
  "hulk",
  "black widow",
  "wolverine",
  "mickey",
  "minnie",
  "donald duck",
  "goofy",
  "elsa",
  "anna",
  "frozen",
  "pocahontas",
  "mulan",
  "cinderella",
  "belle",
  "ariel",
  "simba",
  "nemo",
  "buzz lightyear",
  "woody",
  "pikachu",
  "mario",
  "luigi",
  "sonic",
  "crash bandicoot",
  "spongebob",
  "patrick star",
  "squidward",
  "ninja turtle",
  "teenage mutant",
  "peppa pig",
  "bluey",
  "paw patrol",
];

/** Risky-but-harmless terms that benefit from soft rewrite (generic descriptors) */
const REWRITE_TRIGGERS: { pattern: RegExp; replacement: string }[] = [
  { pattern: /\bsuperhero(es)?\b/gi, replacement: "original comic-style hero$1" },
  { pattern: /\bsuper-hero(es)?\b/gi, replacement: "original comic-style hero$1" },
  { pattern: /\bdisney\s*style\b/gi, replacement: "classic animated style" },
  { pattern: /\bdisney\s*characters?\b/gi, replacement: "original animated characters" },
  { pattern: /\bmarvel\s*style\b/gi, replacement: "comic book style" },
  { pattern: /\bmarvel\s*characters?\b/gi, replacement: "original comic characters" },
  { pattern: /\bdc\s*style\b/gi, replacement: "comic book style" },
  { pattern: /\bdc\s*characters?\b/gi, replacement: "original comic characters" },
];

function logRewrite(reason: string, promptPreview: string): void {
  const preview = promptPreview.slice(0, 30) + (promptPreview.length > 30 ? "…" : "");
  if (process.env.NODE_ENV === "production") {
    console.warn("[moderation] rewrite applied:", reason, "| preview:", preview);
  } else {
    console.info("[moderation] rewrite applied:", reason, "| preview:", preview);
  }
}

function containsCopyrightedCharacter(text: string): boolean {
  const lower = text.toLowerCase();
  return COPYRIGHTED_CHARACTERS.some((name) => lower.includes(name));
}

function containsPublicFigure(text: string): boolean {
  const lower = text.toLowerCase();
  const figures = [
    "trump",
    "biden",
    "obama",
    "putin",
    "elon musk",
    "taylor swift",
    "beyonce",
    "rihanna",
    "drake",
    "kanye",
    "kim kardashian",
    "celebrity",
    "famous person",
  ];
  return figures.some((f) => lower.includes(f));
}

function containsUnsafeContent(text: string): boolean {
  const lower = text.toLowerCase();
  const unsafe = [
    "nude",
    "naked",
    "nsfw",
    "explicit",
    "violence",
    "gore",
    "weapon",
    "gun",
    "blood",
  ];
  return unsafe.some((u) => lower.includes(u));
}

export type ModerationResult =
  | { action: "allow"; prompt: string }
  | { action: "rewrite"; prompt: string; reason: string }
  | { action: "block"; reason: string };

export function processPrompt(input: string): ModerationResult {
  const trimmed = input.trim().slice(0, 600);
  if (!trimmed) return { action: "block", reason: "Prompt cannot be empty." };

  if (containsCopyrightedCharacter(trimmed)) {
    return { action: "block", reason: "copyrighted_character" };
  }
  if (containsPublicFigure(trimmed)) {
    return { action: "block", reason: "public_figure" };
  }
  if (containsUnsafeContent(trimmed)) {
    return { action: "block", reason: "unsafe_content" };
  }

  let rewritten = trimmed;
  let rewriteReason = "";

  for (const { pattern, replacement } of REWRITE_TRIGGERS) {
    if (pattern.test(rewritten)) {
      rewritten = rewritten.replace(pattern, replacement);
      rewriteReason = rewriteReason || "generic_brand_descriptor";
    }
  }

  if (rewritten !== trimmed) {
    logRewrite(rewriteReason, trimmed);
    return { action: "rewrite", prompt: rewritten, reason: rewriteReason };
  }

  return { action: "allow", prompt: trimmed };
}

export const CONTENT_BLOCK_SUGGESTIONS = [
  "Two original comic-style heroes celebrating a birthday",
  "A watercolor portrait with warm, friendly colours",
  "A minimalist line-art illustration for a greeting card",
] as const;
