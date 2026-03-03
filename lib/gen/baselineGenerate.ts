/**
 * Baseline image generation: 1:1 prompt fidelity.
 * - Minimal sanitization only (trim, control chars, length)
 * - Moderation for hard blocks (sexual, gore, minors, self-harm, hate)
 * - NO prompt rewriting, enhancing, patching, or fallback mutation
 */

import { createHash } from "crypto";
import { moderatePrompt } from "@/lib/safety/thinModeration";
import { fetchWithBackoff } from "@/app/api/generate-image/guardrails";

const PROMPT_MAX_LEN = 1000;
type Size = "1024x1024" | "1024x1536" | "1536x1024";

export type BaselineGenerateInput = {
  prompt: string;
  mode: "describe" | "upload";
  referenceImageDataUrl?: string | null;
  size: Size;
  clientId: string;
  requestId?: string;
};

export type BaselineBlockedResult = {
  ok: false;
  blocked: true;
  code: string;
  userMessage: string;
  suggestions: string[];
};

export type BaselineSuccessResult = {
  ok: true;
  imageDataUrl: string;
  promptUsed: string;
  requestId?: string;
};

export type BaselineGenerateResult = BaselineBlockedResult | BaselineSuccessResult;

/** Minimal sanitization: trim, strip control chars, enforce max length. No semantic changes. */
export function minimalSanitize(input: string): { ok: true; prompt: string } | { ok: false; error: string } {
  const trimmed = input.trim().replace(/[\x00-\x1f\x7f]/g, "");
  const limited = trimmed.slice(0, PROMPT_MAX_LEN);
  if (!limited) return { ok: false, error: "Prompt cannot be empty." };
  return { ok: true, prompt: limited };
}

function parseDataUrl(dataUrl: string): { mimeType: string; imageBuffer: ArrayBuffer } | null {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg));base64,(.+)$/);
  if (!match) return null;
  const [, mimeType, base64Payload] = match;
  try {
    const decoded = Buffer.from(base64Payload, "base64");
    const bytes = Uint8Array.from(decoded);
    const imageBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    return { mimeType, imageBuffer };
  } catch {
    return null;
  }
}

async function callGenerate(prompt: string, size: Size): Promise<string> {
  const resp = await fetchWithBackoff(
    "https://api.openai.com/v1/images/generations",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size,
      }),
    },
    { retries: 2, timeoutMs: 90_000 }
  );

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data?.error?.message || "OpenAI error");
  }
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image returned");
  return `data:image/png;base64,${b64}`;
}

async function callEdit(
  prompt: string,
  sourceImageDataUrl: string,
  size: Size
): Promise<string> {
  const parsed = parseDataUrl(sourceImageDataUrl);
  if (!parsed) {
    throw new Error("Invalid uploaded image format. Please use JPG or PNG.");
  }
  const extension = parsed.mimeType === "image/png" ? "png" : "jpg";
  const formData = new FormData();
  formData.set("model", "gpt-image-1");
  formData.set("prompt", prompt);
  formData.set("size", size);
  formData.set("image", new Blob([parsed.imageBuffer], { type: parsed.mimeType }), `upload.${extension}`);

  const resp = await fetchWithBackoff(
    "https://api.openai.com/v1/images/edits",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    },
    { retries: 2, timeoutMs: 90_000 }
  );

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data?.error?.message || "OpenAI edit error");
  }
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image returned");
  return `data:image/png;base64,${b64}`;
}

/** DEV-only: log fidelity metadata. Never log full prompts in production. */
function devLogFidelity(params: {
  promptHash: string;
  promptLength: number;
  excerpt: string;
  moderationFlagged: boolean;
  rewriteOccurred: boolean;
  requestId?: string;
}): void {
  if (process.env.NODE_ENV === "production") return;
  console.info("[gen:fidelity]", JSON.stringify({
    promptHash: params.promptHash,
    promptLength: params.promptLength,
    excerpt: params.excerpt.slice(0, 60) + (params.excerpt.length > 60 ? "…" : ""),
    moderationFlagged: params.moderationFlagged,
    rewriteOccurred: params.rewriteOccurred,
    requestId: params.requestId,
  }));
}

export async function baselineGenerate(
  input: BaselineGenerateInput
): Promise<BaselineGenerateResult> {
  const { prompt: rawPrompt, mode, referenceImageDataUrl, size, clientId, requestId } = input;

  const sanitized = minimalSanitize(rawPrompt);
  if (!sanitized.ok) {
    return {
      ok: false,
      blocked: true,
      code: "empty",
      userMessage: sanitized.error,
      suggestions: [],
    };
  }
  const userPrompt = sanitized.prompt;

  const moderation = await moderatePrompt(userPrompt, clientId);
  if (!moderation.ok) {
    if (process.env.NODE_ENV !== "production") {
      devLogFidelity({
        promptHash: createHash("sha256").update(userPrompt).digest("hex").slice(0, 12),
        promptLength: userPrompt.length,
        excerpt: userPrompt.slice(0, 60),
        moderationFlagged: true,
        rewriteOccurred: false,
        requestId,
      });
    }
    return {
      ok: false,
      blocked: true,
      code: moderation.code,
      userMessage: moderation.userMessage,
      suggestions: moderation.suggestions,
    };
  }

  const finalPrompt = moderation.prompt;
  const rewriteOccurred = finalPrompt !== userPrompt;
  if (rewriteOccurred && process.env.NODE_ENV !== "production") {
    throw new Error(
      `[gen:fidelity] PROMPT_REGRESSION: finalPrompt differs from userPrompt. Rewrite must not occur.`
    );
  }

  if (process.env.NODE_ENV !== "production") {
    devLogFidelity({
      promptHash: createHash("sha256").update(finalPrompt).digest("hex").slice(0, 12),
      promptLength: finalPrompt.length,
      excerpt: finalPrompt.slice(0, 60),
      moderationFlagged: false,
      rewriteOccurred,
      requestId,
    });
  }

  if (mode === "upload" && referenceImageDataUrl) {
    const imageDataUrl = await callEdit(finalPrompt, referenceImageDataUrl, size);
    return { ok: true, imageDataUrl, promptUsed: finalPrompt, requestId };
  }

  const imageDataUrl = await callGenerate(finalPrompt, size);
  return { ok: true, imageDataUrl, promptUsed: finalPrompt, requestId };
}
