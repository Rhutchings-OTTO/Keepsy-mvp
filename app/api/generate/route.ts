/**
 * /api/generate — DALL-E 3 image generation with permanent Cloudinary hosting.
 * Accepts user prompt, returns imageDataUrl (for preview) and designUrl (for checkout).
 * Premium error messages for OpenAI downtime and flagged prompts.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  enforceUsageGuards,
  getClientKey,
} from "@/app/api/generate-image/guardrails";
import { baselineGenerate, minimalSanitize } from "@/lib/gen/baselineGenerate";
import { guardOrigin, guardRateLimit, getRequestId } from "@/lib/security/withSecurity";
import { parseAndValidate, Constraints } from "@/lib/http/validate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PREMIUM_ERRORS = {
  openaiDown:
    "Our atelier is temporarily unavailable. Our artisans are calibrating — please try again in a moment.",
  flagged:
    "We can create original characters and themes, but we can't generate specific copyrighted or trademarked characters. Try describing the style, colours, or mood instead.",
  validation: "Please provide a design prompt to synthesize.",
};

const schema = z.object({
  prompt: z.string().max(Constraints.PROMPT_MAX_LEN),
  sourceImageDataUrl: z.string().max(8 * 1024 * 1024).optional().nullable(),
  designShape: z.enum(["square", "portrait", "landscape"]).optional(),
}).strict();

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const originDeny = guardOrigin(req, "/api/generate", requestId);
  if (originDeny) return originDeny;
  const rateLimitResult = await guardRateLimit(req, "/api/generate", "POST", requestId);
  if ("response" in rateLimitResult) return rateLimitResult.response;

  const headers = { "Cache-Control": "no-store", ...rateLimitResult.headers };

  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: PREMIUM_ERRORS.openaiDown },
        { status: 503, headers }
      );
    }

    const parsed = await parseAndValidate(req, schema);
    if ("error" in parsed) {
      const msg = parsed.error?.error?.message ?? PREMIUM_ERRORS.validation;
      return NextResponse.json(
        { error: msg },
        { status: parsed.status, headers }
      );
    }

    const usageCheck = await enforceUsageGuards(req);
    if (!usageCheck.ok) {
      return NextResponse.json(
        { error: usageCheck.error },
        { status: usageCheck.status, headers }
      );
    }

    const { prompt, sourceImageDataUrl, designShape = "square" } = parsed.data;
    const sanitized = minimalSanitize(prompt);

    if (!sanitized.ok) {
      return NextResponse.json(
        { error: sanitized.error },
        { status: 400, headers }
      );
    }

    const size: "1024x1024" | "1024x1536" | "1536x1024" =
      designShape === "portrait"
        ? "1024x1536"
        : designShape === "landscape"
          ? "1536x1024"
          : "1024x1024";

    const clientId = getClientKey(req);
    const result = await baselineGenerate({
      prompt: sanitized.prompt,
      mode: sourceImageDataUrl ? "upload" : "describe",
      referenceImageDataUrl: sourceImageDataUrl ?? null,
      size,
      clientId,
      requestId,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.userMessage || PREMIUM_ERRORS.flagged,
          code: result.code,
          suggestions: result.suggestions ?? [],
        },
        { status: 400, headers }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        imageDataUrl: result.imageDataUrl,
        designUrl: result.designUrl,
      },
      { status: 200, headers }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Synthesis failed";
    const isOpenAI =
      msg.toLowerCase().includes("openai") ||
      msg.toLowerCase().includes("rate limit") ||
      msg.toLowerCase().includes("timeout");
    return NextResponse.json(
      { error: isOpenAI ? PREMIUM_ERRORS.openaiDown : msg },
      { status: 503, headers }
    );
  }
}
