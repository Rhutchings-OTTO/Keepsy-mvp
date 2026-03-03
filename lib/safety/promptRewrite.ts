/**
 * Rewrite-first, block-last content safety pipeline for image generation.
 */

import { logSafetyEvent } from "./audit";

const SAFE_SUFFIX =
  " Create original characters and an original scene. Avoid depicting any copyrighted characters or logos.";

const MAX_PROMPT_LEN = 600;

const IP_DENYLIST = [
  "batman", "spider-man", "spiderman", "superman", "wonder woman",
  "iron man", "ironman", "captain america", "thor", "hulk",
  "black widow", "wolverine", "avengers", "marvel", "dc comics",
  "mickey", "minnie", "donald duck", "goofy", "elsa", "anna", "frozen",
  "pocahontas", "mulan", "cinderella", "belle", "ariel", "simba", "nemo",
  "buzz lightyear", "woody", "pixar", "disney", "star wars", "yoda", "darth vader",
  "harry potter", "hermione", "ron weasley", "pokemon", "pikachu",
  "mario", "luigi", "sonic", "crash bandicoot", "spongebob", "patrick star", "squidward",
  "ninja turtle", "teenage mutant", "peppa pig", "bluey", "paw patrol",
];

const STYLE_OF_BRANDS = ["disney", "pixar", "marvel", "dreamworks"];

/** Generic styles - allow "in the style of X" when X is in this list */
const GENERIC_STYLES = [
  "watercolor", "watercolour", "oil painting", "oil paint",
  "comic book", "comic", "cartoon", "minimalist", "line art",
  "pastel", "acrylic", "sketch", "illustration", "children's book",
];

const PUBLIC_FIGURES = [
  "trump", "biden", "obama", "putin", "elon musk", "taylor swift",
  "beyonce", "rihanna", "drake", "kanye", "kim kardashian", "celebrity", "famous person",
];

const DISALLOWED = [
  "nude", "naked", "nsfw", "explicit", "child", "minor", "underage",
  "violence", "gore", "blood", "weapon", "gun", "self-harm", "suicide",
];

export type PipelineResult =
  | { ok: true; prompt: string; appliedRewrite?: true; originalPreview?: string; safePreview?: string }
  | { ok: false; code: string; userMessage: string; suggestions: string[] };

function normalize(text: string): string {
  return text.trim().replace(/[\x00-\x1f\x7f]/g, "").slice(0, MAX_PROMPT_LEN);
}

function containsAny(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase();
  return terms.some((t) => lower.includes(t));
}

function detectStyleOf(text: string): "brand" | "generic" | "other" | null {
  const match = text.match(/in\s+the\s+style\s+of\s+([^.!,?]+)/i);
  if (!match) return null;
  const target = match[1].trim().toLowerCase();
  if (STYLE_OF_BRANDS.some((b) => target.includes(b))) return "brand";
  if (GENERIC_STYLES.some((g) => target.includes(g))) return "generic";
  return "other";
}

function rewriteSuperheroPrompt(input: string): string {
  const rewritten = input
    .replace(/\bsuperhero(es)?\b/gi, "ORIGINAL comic-style hero$1 in colourful costumes")
    .replace(/\bsuper-hero(es)?\b/gi, "ORIGINAL comic-style hero$1 in colourful costumes");
  if (!/^(a|an|the)\s/i.test(rewritten.trim())) {
    return `A fun illustration of ${rewritten.trim()}`;
  }
  return rewritten;
}

export function processPromptPipeline(
  input: string,
  clientIdentifier: string
): PipelineResult {
  const normalized = normalize(input);
  if (!normalized) {
    return { ok: false, code: "empty", userMessage: "Prompt cannot be empty.", suggestions: [] };
  }

  if (containsAny(normalized, IP_DENYLIST)) {
    logSafetyEvent("hard_block", "copyrighted_character", { clientId: clientIdentifier, promptLen: normalized.length });
    return {
      ok: false,
      code: "copyrighted_character",
      userMessage: "We can create original characters and themes, but we can't generate specific copyrighted or trademarked characters. Try describing the style, colours, or mood instead.",
      suggestions: [
        "Two original comic-style heroes celebrating a birthday",
        "A bright cartoon birthday card with two caped heroes (original characters)",
        "A fun hero party scene with colourful costumes and confetti",
        "A watercolor portrait with warm, friendly colours",
        "A minimalist line-art illustration for a greeting card",
      ],
    };
  }

  const styleOf = detectStyleOf(normalized);
  if (styleOf === "generic") {
    return { ok: true, prompt: normalized };
  }
  if (styleOf === "brand") {
    logSafetyEvent("hard_block", "style_of_brand", { clientId: clientIdentifier, promptLen: normalized.length });
    return {
      ok: false,
      code: "style_of_brand",
      userMessage: "We can't generate content in the style of specific brands. Try a generic style instead.",
      suggestions: [
        "modern animated family-friendly style",
        "bright children's book illustration",
        "clean comic book style",
      ],
    };
  }

  if (styleOf === "other") {
    const rewritten = normalized.replace(/in\s+the\s+style\s+of\s+[^.!,?]+/gi, "inspired by modern animation") + SAFE_SUFFIX;
    const safePreview = rewritten.slice(0, 120) + (rewritten.length > 120 ? "..." : "");
    logSafetyEvent("rewrite_applied", "style_of_artist", { clientId: clientIdentifier, promptLen: normalized.length });
    return {
      ok: true,
      prompt: rewritten,
      appliedRewrite: true,
      originalPreview: normalized.slice(0, 60) + (normalized.length > 60 ? "..." : ""),
      safePreview,
    };
  }

  if (containsAny(normalized, PUBLIC_FIGURES)) {
    logSafetyEvent("hard_block", "public_figure", { clientId: clientIdentifier, promptLen: normalized.length });
    return {
      ok: false,
      code: "public_figure",
      userMessage: "We can't generate images of real people or public figures. Try describing a fictional person with similar traits instead.",
      suggestions: [
        "A friendly fictional person with warm expression",
        "A generic character in a similar pose or setting",
      ],
    };
  }

  if (containsAny(normalized, DISALLOWED)) {
    logSafetyEvent("hard_block", "disallowed_content", { clientId: clientIdentifier, promptLen: normalized.length });
    return {
      ok: false,
      code: "disallowed_content",
      userMessage: "This request cannot be fulfilled. Please try a different prompt.",
      suggestions: [],
    };
  }

  if (/\bsuperhero(es)?\b|\bsuper-hero(es)?\b/i.test(normalized)) {
    const rewritten = rewriteSuperheroPrompt(normalized) + SAFE_SUFFIX;
    const safePreview = rewritten.slice(0, 120) + (rewritten.length > 120 ? "..." : "");
    logSafetyEvent("rewrite_applied", "generic_superhero", { clientId: clientIdentifier, promptLen: normalized.length });
    return {
      ok: true,
      prompt: rewritten,
      appliedRewrite: true,
      originalPreview: normalized.slice(0, 60) + (normalized.length > 60 ? "..." : ""),
      safePreview,
    };
  }

  return { ok: true, prompt: normalized };
}
