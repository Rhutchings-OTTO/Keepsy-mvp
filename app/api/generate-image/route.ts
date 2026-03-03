import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import {
  enforceUsageGuards,
  fetchWithBackoff,
  getClientKey,
  sanitizePrompt,
} from "./guardrails";
import { processPromptPipeline } from "@/lib/safety/promptRewrite";
import {
  getGenerationMetrics,
  persistMetricsIfDue,
  recordGenerationMetric,
} from "./metrics";
import { guardOrigin, guardRateLimit, getRequestId } from "@/lib/security/withSecurity";
import { parseAndValidate, Constraints } from "@/lib/http/validate";

const CACHE_TTL_MS = 3 * 60 * 1000;
const MAX_IN_FLIGHT_GENERATIONS = 8;
const MAX_SOURCE_IMAGE_DATA_URL_CHARS = 8 * 1024 * 1024;

const generateBodySchema = z
  .object({
    prompt: z.string().max(Constraints.PROMPT_MAX_LEN),
    sourceImageDataUrl: z.string().max(MAX_SOURCE_IMAGE_DATA_URL_CHARS).optional().nullable(),
    designShape: z.enum(["square", "portrait", "landscape"]).optional(),
  })
  .strict();

type CachedGeneration = {
  imageDataUrl: string;
  expiresAt: number;
};

type DesignShape = "square" | "portrait" | "landscape";

function getImageSizeForShape(shape: DesignShape): "1024x1024" | "1024x1536" | "1536x1024" {
  if (shape === "portrait") return "1024x1536";
  if (shape === "landscape") return "1536x1024";
  return "1024x1024";
}

const generationCache = new Map<string, CachedGeneration>();
const inflightByPrompt = new Map<string, Promise<string>>();

const BLOCK_TITLE = "Let's tweak that slightly";

const OPENAI_BLOCK_RESPONSE = {
  code: "content_block" as const,
  title: BLOCK_TITLE,
  message:
    "We can create original characters and themes, but we can't generate specific copyrighted or trademarked characters. Try describing the style, colours, or mood instead.",
  suggestions: [
    "Two original comic-style heroes celebrating a birthday",
    "A watercolor portrait with warm, friendly colours",
    "A minimalist line-art illustration for a greeting card",
  ],
};

function normalizeOpenAIError(message: string): { status: number; contentBlock: boolean; error: string } {
  const lower = message.toLowerCase();
  const isBlock = lower.includes("safety system") || lower.includes("content policy");
  return {
    status: isBlock ? 400 : 500,
    contentBlock: isBlock,
    error: isBlock ? OPENAI_BLOCK_RESPONSE.message : message,
  };
}

function getPromptKey(prompt: string): string {
  return createHash("sha256").update(prompt).digest("hex").slice(0, 32);
}

function readCachedGeneration(promptKey: string): string | null {
  const hit = generationCache.get(promptKey);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    generationCache.delete(promptKey);
    return null;
  }
  return hit.imageDataUrl;
}

async function generateImage(prompt: string, size: "1024x1024" | "1024x1536" | "1536x1024"): Promise<string> {
  const resp = await fetchWithBackoff("https://api.openai.com/v1/images/generations", {
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
  }, { retries: 2, timeoutMs: 90_000 });

  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data?.error?.message || "OpenAI error");
  }

  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image returned");
  return `data:image/png;base64,${b64}`;
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

async function editImage(
  prompt: string,
  sourceImageDataUrl: string,
  size: "1024x1024" | "1024x1536" | "1536x1024"
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

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const originDeny = guardOrigin(req, "/api/generate-image", requestId);
  if (originDeny) return originDeny;
  const rateLimitResult = guardRateLimit(req, "/api/generate-image", "POST", requestId);
  if ("response" in rateLimitResult) return rateLimitResult.response;

  try {
    recordGenerationMetric("totalRequests", 1);
    const parsed = await parseAndValidate(req, generateBodySchema);
    if ("error" in parsed) {
      return NextResponse.json(parsed.error, {
        status: parsed.status,
        headers: { "Content-Type": "application/json", ...rateLimitResult.headers },
      });
    }
    const body = parsed.data;
    const prompt = body.prompt;
    const sourceImageDataUrl = body.sourceImageDataUrl ?? null;
    const designShape: DesignShape = body.designShape ?? "square";
    const generationSize = getImageSizeForShape(designShape);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    const usageCheck = await enforceUsageGuards(req);
    if (!usageCheck.ok) {
      return NextResponse.json({ error: usageCheck.error }, { status: usageCheck.status });
    }

    const clientId = getClientKey(req);
    const pipeline = processPromptPipeline(prompt, clientId);

    if (!pipeline.ok) {
      const blockPayload: Record<string, unknown> = {
        ok: false,
        code: pipeline.code,
        userMessage: pipeline.userMessage,
        suggestions: pipeline.suggestions,
        title: BLOCK_TITLE,
      };
      if (pipeline.code === "soft_warning" && "suggestedPrompt" in pipeline) {
        blockPayload.suggestedPrompt = pipeline.suggestedPrompt;
        blockPayload.appliedPatches = pipeline.appliedPatches ?? [];
      }
      return NextResponse.json(blockPayload, { status: 400 });
    }

    const promptCheck = sanitizePrompt(pipeline.prompt);
    if (!promptCheck.ok) {
      return NextResponse.json({ error: promptCheck.error }, { status: 400 });
    }

    const startedAt = Date.now();
    const promptKey = getPromptKey(`${promptCheck.prompt}::${generationSize}`);
    const cached = readCachedGeneration(promptKey);
    const rewriteMeta =
      pipeline.ok && pipeline.appliedRewrite
        ? {
            appliedRewrite: true,
            appliedPatches: pipeline.appliedPatches ?? [],
            patchedPrompt: pipeline.patchedPrompt ?? pipeline.prompt,
            originalPreview: pipeline.originalPreview,
            safePreview: pipeline.safePreview ?? pipeline.prompt.slice(0, 80) + (pipeline.prompt.length > 80 ? "..." : ""),
          }
        : undefined;

    if (cached) {
      recordGenerationMetric("cacheHits", 1);
      recordGenerationMetric("totalSuccess", 1);
      recordGenerationMetric("lastLatencyMs", Date.now() - startedAt);
      return NextResponse.json({
        ok: true,
        imageDataUrl: cached,
        cached: true,
        latencyMs: Date.now() - startedAt,
        ...rewriteMeta,
      });
    }
    recordGenerationMetric("cacheMisses", 1);

    const existingInflight = inflightByPrompt.get(promptKey);
    if (existingInflight) {
      const imageDataUrl = await existingInflight;
      recordGenerationMetric("dedupedHits", 1);
      recordGenerationMetric("totalSuccess", 1);
      recordGenerationMetric("lastLatencyMs", Date.now() - startedAt);
      return NextResponse.json({
        ok: true,
        imageDataUrl,
        deduped: true,
        latencyMs: Date.now() - startedAt,
        ...rewriteMeta,
      });
    }

    const snapshot = getGenerationMetrics();
    if (snapshot.inFlightCount >= MAX_IN_FLIGHT_GENERATIONS) {
      recordGenerationMetric("busyRejects", 1);
      recordGenerationMetric("totalErrors", 1);
      return NextResponse.json(
        { error: "Generator is busy. Please retry in a few seconds." },
        { status: 503 }
      );
    }

    if (sourceImageDataUrl) {
      recordGenerationMetric("inFlightCount", 1);
      try {
        const imageDataUrl = await editImage(promptCheck.prompt, sourceImageDataUrl, generationSize);
        recordGenerationMetric("totalSuccess", 1);
        recordGenerationMetric("lastLatencyMs", Date.now() - startedAt);
        return NextResponse.json({
          ok: true,
          imageDataUrl,
          edited: true,
          latencyMs: Date.now() - startedAt,
          ...rewriteMeta,
        });
      } finally {
        recordGenerationMetric("inFlightCount", -1);
      }
    }

    recordGenerationMetric("inFlightCount", 1);
    const generationPromise = (async () => {
      const imageDataUrl = await generateImage(promptCheck.prompt, generationSize);
      generationCache.set(promptKey, {
        imageDataUrl,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
      return imageDataUrl;
    })();

    inflightByPrompt.set(promptKey, generationPromise);

    try {
      const imageDataUrl = await generationPromise;
      recordGenerationMetric("totalSuccess", 1);
      recordGenerationMetric("lastLatencyMs", Date.now() - startedAt);
      return NextResponse.json({
        ok: true,
        imageDataUrl,
        cached: false,
        latencyMs: Date.now() - startedAt,
        ...rewriteMeta,
      });
    } finally {
      recordGenerationMetric("inFlightCount", -1);
      inflightByPrompt.delete(promptKey);
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    recordGenerationMetric("totalErrors", 1);
    const normalized = normalizeOpenAIError(message);
    const body = normalized.contentBlock
      ? { ok: false, error: normalized.error, ...OPENAI_BLOCK_RESPONSE }
      : { ok: false, error: normalized.error };
    return NextResponse.json(body, { status: normalized.status });
  } finally {
    persistMetricsIfDue();
  }
}