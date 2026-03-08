/**
 * Baseline image generation.
 * - Minimal sanitization (trim, control chars, length)
 * - Moderation for hard blocks (sexual, gore, minors, self-harm, hate)
 * - Keepsy Artistic Director: print optimization, artisanal aesthetic, background control
 */

import { sha256Hex } from "@/lib/crypto/sha256";
import { moderatePrompt } from "@/lib/safety/thinModeration";
import { applyArtisticDirection } from "@/lib/gen/artisticDirector";
import { fetchWithBackoff } from "@/app/api/generate-image/guardrails";
import { uploadImageToCloudinary } from "@/lib/uploadImage";

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
  /** Permanent URL (Cloudinary) for checkout/fulfillment. Falls back to imageDataUrl if upload fails. */
  designUrl: string;
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

/** DALL-E 3 size mapping. API accepts 1024x1024, 1024x1792, 1792x1024. */
function mapSizeToDalle3(size: Size): "1024x1024" | "1024x1792" | "1792x1024" {
  if (size === "1024x1536") return "1024x1792";
  if (size === "1536x1024") return "1792x1024";
  return "1024x1024";
}

async function callGenerate(prompt: string, size: Size): Promise<string> {
  const useDalle3 = Boolean(process.env.OPENAI_USE_DALLE3);
  const model = useDalle3 ? "dall-e-3" : "gpt-image-1";
  const requestSize = useDalle3 ? mapSizeToDalle3(size) : size;

  const body: Record<string, unknown> =
    model === "dall-e-3"
      ? {
          model: "dall-e-3",
          prompt,
          size: requestSize,
          quality: "standard",
          style: "vivid",
          response_format: "b64_json",
        }
      : { model: "gpt-image-1", prompt, size: requestSize };

  const resp = await fetchWithBackoff(
    "https://api.openai.com/v1/images/generations",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    },
    { retries: 2, timeoutMs: 120_000 }
  );

  const data = await resp.json();
  if (!resp.ok) {
    const errMsg = data?.error?.message || "OpenAI error";
    if (String(errMsg).toLowerCase().includes("content policy") ||
        String(errMsg).toLowerCase().includes("safety system")) {
      throw new Error(
        "We can create original characters and themes, but we can't generate specific copyrighted or trademarked characters. Try describing the style, colours, or mood instead."
      );
    }
    if (resp.status === 503 || resp.status === 429) {
      throw new Error("Our atelier is temporarily busy. Please retry in a moment.");
    }
    throw new Error(errMsg);
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
        promptHash: (await sha256Hex(userPrompt)).slice(0, 12),
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

  const moderatedPrompt = moderation.prompt;
  const finalPrompt = applyArtisticDirection({
    userPrompt: moderatedPrompt,
    mode,
    maxTotalLength: 1500,
  });

  if (process.env.NODE_ENV !== "production") {
    devLogFidelity({
      promptHash: (await sha256Hex(finalPrompt)).slice(0, 12),
      promptLength: finalPrompt.length,
      excerpt: finalPrompt.slice(0, 60),
      moderationFlagged: false,
      rewriteOccurred: finalPrompt !== moderatedPrompt,
      requestId,
    });
  }

  let imageDataUrl: string;
  if (mode === "upload" && referenceImageDataUrl) {
    imageDataUrl = await callEdit(finalPrompt, referenceImageDataUrl, size);
  } else {
    imageDataUrl = await callGenerate(finalPrompt, size);
  }

  const uploadResult = await uploadImageToCloudinary(imageDataUrl);
  // Use empty string (not imageDataUrl) on failure — makes the missing upload explicit.
  // Downstream: checkoutViaKeepsyAPI strips base64 anyway; empty string is detectable.
  const designUrl = uploadResult.ok ? uploadResult.url : "";

  return {
    ok: true,
    imageDataUrl,
    designUrl,
    promptUsed: finalPrompt,
    requestId,
  };
}
