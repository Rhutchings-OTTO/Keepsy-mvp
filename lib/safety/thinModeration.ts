/**
 * Thin moderation layer.
 * 1) OpenAI Moderation API for disallowed content (hard block)
 * 2) Light fragment patch for public figure likeness only
 * 3) Hard block for named copyrighted characters
 * No aggressive rewriting, no similarity scoring, no safe suffix injection.
 */

import { logThinModeration } from "./audit";

const MAX_PROMPT_LEN = 600;

/** Named copyrighted characters – hard block, no rewrite */
const COPYRIGHTED_CHARACTERS = [
  "batman", "spider-man", "spiderman", "superman", "wonder woman",
  "iron man", "ironman", "captain america", "thor", "hulk",
  "black widow", "wolverine", "mickey", "minnie", "donald duck",
  "goofy", "elsa", "anna", "frozen", "pocahontas", "mulan",
  "cinderella", "belle", "ariel", "simba", "nemo", "buzz lightyear",
  "woody", "pikachu", "mario", "luigi", "sonic", "crash bandicoot",
  "spongebob", "patrick star", "squidward", "ninja turtle",
  "teenage mutant", "peppa pig", "bluey", "paw patrol",
];

/** Minimal fragment replacements for public figure likeness only. No long suffix. */
const PUBLIC_FIGURE_PATCHES: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\(think\s+leo\s+in\s+the\s+great\s+gatsby\)/gi, replacement: "(a charismatic 1920s art-deco party vibe)" },
  { pattern: /\blike\s+(?:leo|leonardo\s+dicaprio)\b[^.]*/gi, replacement: "with a charismatic classic 1920s party vibe" },
  { pattern: /\b(?:like|as)\s+taylor\s+swift\b[^.]*/gi, replacement: "with an elegant pop-star aesthetic" },
  { pattern: /\b(?:like|as)\s+beyonce\b[^.]*/gi, replacement: "with a glamorous performance aesthetic" },
  { pattern: /\bgreat\s+gatsby\b/gi, replacement: "1920s art-deco jazz age party" },
];

export type ThinModerationResult =
  | { ok: true; prompt: string; fragmentPatchApplied?: boolean }
  | { ok: false; code: string; userMessage: string; suggestions: string[] };

function containsCopyrightedCharacter(text: string): boolean {
  const lower = text.toLowerCase();
  return COPYRIGHTED_CHARACTERS.some((name) => lower.includes(name));
}

function applyPublicFigureFragmentPatch(text: string): { patched: string; applied: boolean } {
  let result = text;
  let applied = false;
  for (const { pattern, replacement } of PUBLIC_FIGURE_PATCHES) {
    const regex = new RegExp(pattern.source, pattern.flags);
    if (regex.test(result)) {
      result = result.replace(new RegExp(pattern.source, pattern.flags), replacement);
      applied = true;
    }
  }
  return { patched: result.trim(), applied };
}

async function checkOpenAIModeration(input: string): Promise<{ flagged: boolean; categories?: string[] }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { flagged: false };

  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        input: input.slice(0, MAX_PROMPT_LEN),
        model: "text-moderation-latest",
      }),
    });

    const data = await res.json();
    if (!res.ok) return { flagged: false };

    const result = data.results?.[0];
    if (!result) return { flagged: false };

    if (!result.flagged) return { flagged: false };

    const categories: string[] = [];
    const cats = result.categories || {};
    for (const key of Object.keys(cats)) {
      if (cats[key] === true) categories.push(key);
    }
    return { flagged: true, categories };
  } catch {
    return { flagged: false };
  }
}

export async function moderatePrompt(
  input: string,
  clientIdentifier: string
): Promise<ThinModerationResult> {
  const normalized = input.trim().replace(/[\x00-\x1f\x7f]/g, "").slice(0, MAX_PROMPT_LEN);
  if (!normalized) {
    logThinModeration({ event: "hard_block", reason: "empty", clientId: clientIdentifier });
    return {
      ok: false,
      code: "empty",
      userMessage: "Prompt cannot be empty.",
      suggestions: [],
    };
  }

  if (containsCopyrightedCharacter(normalized)) {
    logThinModeration({ event: "hard_block", reason: "copyrighted_character", clientId: clientIdentifier });
    return {
      ok: false,
      code: "copyrighted_character",
      userMessage:
        "We can create original characters and themes, but we can't generate specific copyrighted or trademarked characters. Try describing the style, colours, or mood instead.",
      suggestions: [
        "Two original comic-style heroes celebrating a birthday",
        "A watercolor portrait with warm, friendly colours",
        "A minimalist line-art illustration for a greeting card",
      ],
    };
  }

  const modResult = await checkOpenAIModeration(normalized);
  if (modResult.flagged) {
    logThinModeration({
      event: "hard_block",
      reason: "openai_moderation",
      clientId: clientIdentifier,
      categories: modResult.categories,
    });
    return {
      ok: false,
      code: "moderation_block",
      userMessage: "This request cannot be fulfilled. Please try a different prompt.",
      suggestions: [],
    };
  }

  const { patched, applied } = applyPublicFigureFragmentPatch(normalized);
  if (applied) {
    logThinModeration({ event: "fragment_patch", reason: "public_figure_likeness", clientId: clientIdentifier });
    return { ok: true, prompt: patched, fragmentPatchApplied: true };
  }

  return { ok: true, prompt: normalized };
}
