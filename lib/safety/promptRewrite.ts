/**
 * Rewrite-first, block-last content safety pipeline.
 * Uses patch-based surgical rewriting; preserves user intent.
 */

import { logSafetyEvent } from "./audit";
import {
  applyPatches,
  computeSimilarity,
  maybeAddIPSuffix,
  SIMILARITY_THRESHOLD,
  type Patch,
} from "./patchRewrite";

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

const GENERIC_STYLES = [
  "watercolor", "watercolour", "oil painting", "oil paint",
  "comic book", "comic", "cartoon", "minimalist", "line art",
  "pastel", "acrylic", "sketch", "illustration", "children's book",
];

const PUBLIC_FIGURES = [
  "trump", "biden", "obama", "putin", "elon musk", "taylor swift",
  "beyonce", "rihanna", "drake", "kanye", "kim kardashian", "celebrity", "famous person",
];

/** Patterns suggesting direct likeness request (hard block) */
const DIRECT_LIKENESS_PATTERNS = [
  /\b(?:photo|picture|image|portrait|drawing|draw)\s+of\s+/i,
  /\b(?:as|depicting|showing)\s+(?:[a-z\s]+)\s+(?:trump|biden|obama|putin|taylor swift|beyonce|rihanna|drake|kanye|kim kardashian|elon musk)\b/i,
];

const DISALLOWED = [
  "nude", "naked", "nsfw", "explicit", "child", "minor", "underage",
  "violence", "gore", "blood", "weapon", "gun", "self-harm", "suicide",
];

export type PipelineResult =
  | {
      ok: true;
      prompt: string;
      appliedRewrite?: true;
      appliedPatches?: Patch[];
      patchedPrompt?: string;
      originalPreview?: string;
      safePreview?: string;
    }
  | {
      ok: false;
      code: string;
      userMessage: string;
      suggestions: string[];
      suggestedPrompt?: string;
      appliedPatches?: Patch[];
    };

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

function isDirectLikenessRequest(text: string): boolean {
  if (!containsAny(text, PUBLIC_FIGURES)) return false;
  return DIRECT_LIKENESS_PATTERNS.some((p) => p.test(text));
}

/** Check if prompt has patchable celebrity/vibe references (think X, like X, great gatsby) */
function hasPatchableVibeRef(text: string): boolean {
  const lower = text.toLowerCase();
  if (/\bthink\s+[a-z]+/.test(lower)) return true;
  if (/\blike\s+(?:leo|leonardo|taylor|beyonce|drake|kanye|rihanna)/.test(lower)) return true;
  if (/\bgreat\s+gatsby\b/.test(lower)) return true;
  if (/in\s+the\s+style\s+of\s+[a-z\s]+(?:animation|artist|film)/.test(lower)) return true;
  return false;
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
    logSafetyEvent("hard_block", "copyrighted_character", {
      clientId: clientIdentifier,
      promptLen: normalized.length,
    });
    return {
      ok: false,
      code: "copyrighted_character",
      userMessage:
        "We can create original characters and themes, but we can't generate specific copyrighted or trademarked characters. Try describing the style, colours, or mood instead.",
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
    logSafetyEvent("hard_block", "style_of_brand", {
      clientId: clientIdentifier,
      promptLen: normalized.length,
    });
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
    const { patched, patches } = applyPatches(normalized);
    const hadIPKeyword = patches.length > 0;
    const finalPrompt = maybeAddIPSuffix(patched, hadIPKeyword);
    const similarity = computeSimilarity(normalized, finalPrompt);
    if (similarity < SIMILARITY_THRESHOLD) {
      logSafetyEvent("soft_warning", "style_of_artist", {
        clientId: clientIdentifier,
        promptLen: normalized.length,
        similarityScore: Math.round(similarity * 100) / 100,
        patchCount: patches.length,
      });
      return {
        ok: false,
        code: "soft_warning",
        userMessage: "We adjusted a few words to keep this original. Use the suggested prompt below to proceed.",
        suggestions: ["Use suggested safe prompt"],
        suggestedPrompt: finalPrompt,
        appliedPatches: patches,
      };
    }
    logSafetyEvent("rewrite_applied", "style_of_artist", {
      clientId: clientIdentifier,
      promptLen: normalized.length,
      similarityScore: Math.round(similarity * 100) / 100,
      patchCount: patches.length,
    });
    return {
      ok: true,
      prompt: finalPrompt,
      appliedRewrite: true,
      appliedPatches: patches,
      patchedPrompt: finalPrompt,
      originalPreview: normalized.slice(0, 80) + (normalized.length > 80 ? "..." : ""),
      safePreview: finalPrompt.slice(0, 120) + (finalPrompt.length > 120 ? "..." : ""),
    };
  }

  if (isDirectLikenessRequest(normalized)) {
    logSafetyEvent("hard_block", "public_figure", {
      clientId: clientIdentifier,
      promptLen: normalized.length,
    });
    return {
      ok: false,
      code: "public_figure",
      userMessage:
        "We can't generate images of real people or public figures. Try describing a fictional person with similar traits instead.",
      suggestions: [
        "A friendly fictional person with warm expression",
        "A generic character in a similar pose or setting",
      ],
    };
  }

  if (containsAny(normalized, DISALLOWED)) {
    logSafetyEvent("hard_block", "disallowed_content", {
      clientId: clientIdentifier,
      promptLen: normalized.length,
    });
    return {
      ok: false,
      code: "disallowed_content",
      userMessage: "This request cannot be fulfilled. Please try a different prompt.",
      suggestions: [],
    };
  }

  if (hasPatchableVibeRef(normalized)) {
    const { patched, patches } = applyPatches(normalized);
    if (patches.length === 0) {
      return { ok: true, prompt: normalized };
    }
    const hadIPKeyword = patches.some((p) =>
      /gatsby|leo|celebrity|style\s+of/i.test(p.from)
    );
    const finalPrompt = maybeAddIPSuffix(patched, hadIPKeyword);
    const similarity = computeSimilarity(normalized, finalPrompt);

    if (similarity < SIMILARITY_THRESHOLD) {
      logSafetyEvent("soft_warning", "vibe_reference", {
        clientId: clientIdentifier,
        promptLen: normalized.length,
        similarityScore: Math.round(similarity * 100) / 100,
        patchCount: patches.length,
      });
      return {
        ok: false,
        code: "soft_warning",
        userMessage: "We adjusted a couple of words to keep this original. Click below to try with the suggested wording.",
        suggestions: ["Use suggested safe prompt"],
        suggestedPrompt: finalPrompt,
        appliedPatches: patches,
      };
    }

    logSafetyEvent("rewrite_applied", "vibe_reference", {
      clientId: clientIdentifier,
      promptLen: normalized.length,
      similarityScore: Math.round(similarity * 100) / 100,
      patchCount: patches.length,
    });
    return {
      ok: true,
      prompt: finalPrompt,
      appliedRewrite: true,
      appliedPatches: patches,
      patchedPrompt: finalPrompt,
      originalPreview: normalized.slice(0, 80) + (normalized.length > 80 ? "..." : ""),
      safePreview: finalPrompt.slice(0, 120) + (finalPrompt.length > 120 ? "..." : ""),
    };
  }

  if (containsAny(normalized, PUBLIC_FIGURES) && !hasPatchableVibeRef(normalized)) {
    logSafetyEvent("hard_block", "public_figure", {
      clientId: clientIdentifier,
      promptLen: normalized.length,
    });
    return {
      ok: false,
      code: "public_figure",
      userMessage:
        "We can't generate images of real people or public figures. Try describing a fictional person with similar traits instead.",
      suggestions: [
        "A friendly fictional person with warm expression",
        "A generic character in a similar pose or setting",
      ],
    };
  }

  return { ok: true, prompt: normalized };
}
