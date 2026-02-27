import { NextResponse } from "next/server";
import { createHash } from "crypto";
import {
  enforceUsageGuards,
  fetchWithBackoff,
  sanitizePrompt,
} from "./guardrails";
import { getGenerationMetrics, recordGenerationMetric } from "./metrics";

const CACHE_TTL_MS = 3 * 60 * 1000;
const MAX_IN_FLIGHT_GENERATIONS = 8;

type CachedGeneration = {
  imageDataUrl: string;
  expiresAt: number;
};

type GenerationRequestBody = {
  prompt?: unknown;
  sourceImageDataUrl?: unknown;
};

const generationCache = new Map<string, CachedGeneration>();
const inflightByPrompt = new Map<string, Promise<string>>();

function normalizeGenerationError(message: string): { status: number; error: string } {
  const lower = message.toLowerCase();
  if (lower.includes("safety system") || lower.includes("content policy")) {
    return {
      status: 400,
      error: "This image request was blocked by safety checks. Try a different prompt or source image.",
    };
  }
  return { status: 500, error: message };
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

async function generateImage(prompt: string): Promise<string> {
  const resp = await fetchWithBackoff("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
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

async function editImage(prompt: string, sourceImageDataUrl: string): Promise<string> {
  const parsed = parseDataUrl(sourceImageDataUrl);
  if (!parsed) {
    throw new Error("Invalid uploaded image format. Please use JPG or PNG.");
  }

  const extension = parsed.mimeType === "image/png" ? "png" : "jpg";
  const formData = new FormData();
  formData.set("model", "gpt-image-1");
  formData.set("prompt", prompt);
  formData.set("size", "1024x1024");
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
  try {
    recordGenerationMetric("totalRequests", 1);
    const body = (await req.json()) as GenerationRequestBody;
    const prompt = body?.prompt;
    const sourceImageDataUrl =
      typeof body?.sourceImageDataUrl === "string" ? body.sourceImageDataUrl : null;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
    }

    const usageCheck = await enforceUsageGuards(req);
    if (!usageCheck.ok) {
      return NextResponse.json({ error: usageCheck.error }, { status: usageCheck.status });
    }

    const promptCheck = sanitizePrompt(prompt);
    if (!promptCheck.ok) {
      return NextResponse.json({ error: promptCheck.error }, { status: 400 });
    }

    const startedAt = Date.now();
    const promptKey = getPromptKey(promptCheck.prompt);
    const cached = readCachedGeneration(promptKey);
    if (cached) {
      recordGenerationMetric("cacheHits", 1);
      recordGenerationMetric("totalSuccess", 1);
      recordGenerationMetric("lastLatencyMs", Date.now() - startedAt);
      return NextResponse.json({
        imageDataUrl: cached,
        cached: true,
        latencyMs: Date.now() - startedAt,
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
        imageDataUrl,
        deduped: true,
        latencyMs: Date.now() - startedAt,
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
        const imageDataUrl = await editImage(promptCheck.prompt, sourceImageDataUrl);
        recordGenerationMetric("totalSuccess", 1);
        recordGenerationMetric("lastLatencyMs", Date.now() - startedAt);
        return NextResponse.json({
          imageDataUrl,
          edited: true,
          latencyMs: Date.now() - startedAt,
        });
      } finally {
        recordGenerationMetric("inFlightCount", -1);
      }
    }

    recordGenerationMetric("inFlightCount", 1);
    const generationPromise = (async () => {
      const imageDataUrl = await generateImage(promptCheck.prompt);
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
        imageDataUrl,
        cached: false,
        latencyMs: Date.now() - startedAt,
      });
    } finally {
      recordGenerationMetric("inFlightCount", -1);
      inflightByPrompt.delete(promptKey);
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    recordGenerationMetric("totalErrors", 1);
    const normalized = normalizeGenerationError(message);
    return NextResponse.json({ error: normalized.error }, { status: normalized.status });
  }
}