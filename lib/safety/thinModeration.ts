/**
 * Thin moderation layer.
 * 1) OpenAI Moderation API for disallowed content (hard block)
 * 2) Hard block for named copyrighted characters
 * NO prompt rewriting. 1:1 prompt fidelity when block passes.
 */

import { logThinModeration } from "./audit";

const MAX_PROMPT_LEN = 1000;

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

export type ThinModerationResult =
  | { ok: true; prompt: string }
  | { ok: false; code: string; userMessage: string; suggestions: string[] };

function containsCopyrightedCharacter(text: string): boolean {
  const lower = text.toLowerCase();
  return COPYRIGHTED_CHARACTERS.some((name) => lower.includes(name));
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

  return { ok: true, prompt: normalized };
}
