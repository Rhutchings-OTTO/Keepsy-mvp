import { NextResponse } from "next/server";
import { z } from "zod";
import { sha256Hex } from "@/lib/crypto/sha256";
import {
  enforceUsageGuards,
  getClientKey,
} from "./guardrails";
import { baselineGenerate, minimalSanitize } from "@/lib/gen/baselineGenerate";
import {
  getGenerationMetrics,
  persistMetricsIfDue,
  recordGenerationMetric,
} from "./metrics";
import { guardOrigin, guardRateLimit, getRequestId } from "@/lib/security/withSecurity";
import { parseAndValidate, Constraints } from "@/lib/http/validate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
  designUrl?: string;
  expiresAt: number;
};

type DesignShape = "square" | "portrait" | "landscape";

function getImageSizeForShape(shape: DesignShape): "1024x1024" | "1024x1536" | "1536x1024" {
  if (shape === "portrait") return "1024x1536";
  if (shape === "landscape") return "1536x1024";
  return "1024x1024";
}

const generationCache = new Map<string, CachedGeneration>();
type InflightResult =
  | { ok: true; imageDataUrl: string; designUrl: string }
  | { ok: false; code: string; userMessage: string; suggestions: string[] };
const inflightByPrompt = new Map<string, Promise<InflightResult>>();

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

async function getPromptKey(prompt: string): Promise<string> {
  return (await sha256Hex(prompt)).slice(0, 32);
}

function readCachedGeneration(promptKey: string): CachedGeneration | null {
  const hit = generationCache.get(promptKey);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    generationCache.delete(promptKey);
    return null;
  }
  return hit;
}

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const originDeny = guardOrigin(req, "/api/generate-image", requestId);
  if (originDeny) return originDeny;
  const rateLimitResult = await guardRateLimit(req, "/api/generate-image", "POST", requestId);
  if ("response" in rateLimitResult) return rateLimitResult.response;

  const noStoreHeaders = { "Cache-Control": "no-store" };

  try {
    recordGenerationMetric("totalRequests", 1);
    const parsed = await parseAndValidate(req, generateBodySchema);
    if ("error" in parsed) {
      return NextResponse.json(parsed.error, {
        status: parsed.status,
        headers: { "Content-Type": "application/json", ...noStoreHeaders, ...rateLimitResult.headers },
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

    const sanitized = minimalSanitize(prompt);
    if (!sanitized.ok) {
      return NextResponse.json(
        { ok: false, code: "empty", userMessage: sanitized.error, suggestions: [], title: BLOCK_TITLE },
        { status: 400, headers: noStoreHeaders }
      );
    }

    const promptKey = await getPromptKey(`${sanitized.prompt}::${generationSize}`);
    const startedAt = Date.now();
    const cached = readCachedGeneration(promptKey);

    if (cached) {
      recordGenerationMetric("cacheHits", 1);
      recordGenerationMetric("totalSuccess", 1);
      recordGenerationMetric("lastLatencyMs", Date.now() - startedAt);
      return NextResponse.json(
        {
          ok: true,
          imageDataUrl: cached.imageDataUrl,
          designUrl: cached.designUrl ?? cached.imageDataUrl,
          cached: true,
          latencyMs: Date.now() - startedAt,
        },
        { headers: noStoreHeaders }
      );
    }
    recordGenerationMetric("cacheMisses", 1);

    const existingInflight = inflightByPrompt.get(promptKey);
    if (existingInflight) {
      const dedupResult = await existingInflight;
      if (!dedupResult.ok) {
        return NextResponse.json(
          {
            ok: false,
            code: dedupResult.code,
            userMessage: dedupResult.userMessage,
            suggestions: dedupResult.suggestions,
            title: BLOCK_TITLE,
          },
          { status: 400, headers: noStoreHeaders }
        );
      }
      recordGenerationMetric("dedupedHits", 1);
      recordGenerationMetric("totalSuccess", 1);
      recordGenerationMetric("lastLatencyMs", Date.now() - startedAt);
      return NextResponse.json(
        {
          ok: true,
          imageDataUrl: dedupResult.imageDataUrl,
          designUrl: dedupResult.designUrl ?? dedupResult.imageDataUrl,
          deduped: true,
          latencyMs: Date.now() - startedAt,
        },
        { headers: noStoreHeaders }
      );
    }

    const snapshot = getGenerationMetrics();
    if (snapshot.inFlightCount >= MAX_IN_FLIGHT_GENERATIONS) {
      recordGenerationMetric("busyRejects", 1);
      recordGenerationMetric("totalErrors", 1);
      return NextResponse.json(
        { error: "Generator is busy. Please retry in a few seconds." },
        { status: 503, headers: noStoreHeaders }
      );
    }

    const clientId = getClientKey(req);
    const mode = sourceImageDataUrl ? "upload" : "describe";

    const runGeneration = async (): Promise<InflightResult> => {
      recordGenerationMetric("inFlightCount", 1);
      try {
        const result = await baselineGenerate({
          prompt: sanitized.prompt,
          mode,
          referenceImageDataUrl: sourceImageDataUrl,
          size: generationSize,
          clientId,
          requestId,
        });

        if (!result.ok) {
          return {
            ok: false,
            code: result.code,
            userMessage: result.userMessage,
            suggestions: result.suggestions,
          };
        }

        const { imageDataUrl, designUrl, promptUsed } = result;
        const cacheKey = await getPromptKey(`${promptUsed}::${generationSize}`);
        generationCache.set(cacheKey, {
          imageDataUrl,
          designUrl,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
        return { ok: true, imageDataUrl, designUrl };
      } finally {
        recordGenerationMetric("inFlightCount", -1);
      }
    };

    const generationPromise = runGeneration();
    inflightByPrompt.set(promptKey, generationPromise);

    const genResult = await generationPromise;
    inflightByPrompt.delete(promptKey);

    if (!genResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: genResult.code,
          userMessage: genResult.userMessage,
          suggestions: genResult.suggestions,
          title: BLOCK_TITLE,
        },
        { status: 400, headers: noStoreHeaders }
      );
    }

    recordGenerationMetric("totalSuccess", 1);
    recordGenerationMetric("lastLatencyMs", Date.now() - startedAt);
    return NextResponse.json(
      {
        ok: true,
        imageDataUrl: genResult.imageDataUrl,
        designUrl: genResult.designUrl ?? genResult.imageDataUrl,
        edited: mode === "upload",
        cached: false,
        latencyMs: Date.now() - startedAt,
      },
      { headers: noStoreHeaders }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    recordGenerationMetric("totalErrors", 1);
    const normalized = normalizeOpenAIError(message);
    const body = normalized.contentBlock
      ? { ok: false, error: normalized.error, ...OPENAI_BLOCK_RESPONSE }
      : { ok: false, error: normalized.error };
    return NextResponse.json(body, { status: normalized.status, headers: noStoreHeaders });
  } finally {
    persistMetricsIfDue();
  }
}
