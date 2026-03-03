/**
 * Safe request parsing and Zod validation. Reject unknown fields (strict).
 */
import { z, type ZodSchema } from "zod";
import { ErrorCodes, toErrorResponse } from "./errors";
import type { ApiErrorShape } from "./errors";

const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2MB default
const WEBHOOK_MAX_BYTES = 512 * 1024; // 512KB for Stripe webhook

/** Safely parse JSON with size limit. Returns null if invalid. */
export async function parseJsonSafe(
  req: Request,
  maxBytes = MAX_BODY_BYTES
): Promise<{ data: unknown } | { error: ApiErrorShape; status: number }> {
  const contentLength = req.headers.get("content-length");
  if (contentLength) {
    const len = parseInt(contentLength, 10);
    if (Number.isNaN(len) || len > maxBytes) {
      const { body, status } = toErrorResponse(
        ErrorCodes.PAYLOAD_TOO_LARGE,
        `Request body must not exceed ${Math.round(maxBytes / 1024)}KB.`
      );
      return { error: body, status };
    }
  }

  try {
    const text = await req.text();
    if (text.length > maxBytes) {
      const { body, status } = toErrorResponse(
        ErrorCodes.PAYLOAD_TOO_LARGE,
        `Request body must not exceed ${Math.round(maxBytes / 1024)}KB.`
      );
      return { error: body, status };
    }
    const data = JSON.parse(text) as unknown;
    return { data };
  } catch {
    const { body, status } = toErrorResponse(ErrorCodes.VALIDATION_FAILED, "Invalid JSON body.");
    return { error: body, status };
  }
}

/**
 * Validate parsed data against Zod schema (strict - rejects unknown keys).
 * Returns typed data or error response.
 */
export function validateWithSchema<T>(
  data: unknown,
  schema: ZodSchema<T>
): { data: T } | { error: ApiErrorShape; status: number } {
  const strictSchema = "strict" in schema && typeof schema.strict === "function" ? schema.strict() : schema;
  const result = (strictSchema as ZodSchema<T>).safeParse(data);
  if (result.success) {
    return { data: result.data };
  }
  const first = result.error.issues[0];
  const message = first ? `${first.path.join(".")}: ${first.message}` : "Validation failed.";
  const { body, status } = toErrorResponse(ErrorCodes.VALIDATION_FAILED, message);
  return { error: body, status };
}

/** Parse and validate in one step. Use when body is JSON. */
export async function parseAndValidate<T>(
  req: Request,
  schema: ZodSchema<T>,
  maxBytes = MAX_BODY_BYTES
): Promise<
  | { data: T; rawText?: string }
  | { error: ApiErrorShape; status: number }
> {
  const parsed = await parseJsonSafe(req, maxBytes);
  if ("error" in parsed) return parsed;
  const validated = validateWithSchema(parsed.data, schema);
  if ("error" in validated) return validated;
  return { data: validated.data };
}

/** Common constraints */
export const Constraints = {
  PROMPT_MAX_LEN: 1200,
  MESSAGE_MAX_LEN: 500,
  NAME_MAX_LEN: 120,
  ID_MAX_LEN: 64,
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
} as const;

export const schemas = {
  /** Stripe webhook: raw text only, no schema - verification is separate */
  webhookMaxBytes: WEBHOOK_MAX_BYTES,

  /** Prompt: max length, trim, no control chars */
  prompt: z
    .string()
    .max(Constraints.PROMPT_MAX_LEN, `Prompt must be at most ${Constraints.PROMPT_MAX_LEN} characters`)
    .transform((s) => s.replace(/[\x00-\x1f\x7f]/g, "").trim())
    .refine((s) => s.length > 0, "Prompt cannot be empty"),

  /** Generic ID (alphanumeric, underscore, hyphen) */
  id: z
    .string()
    .max(Constraints.ID_MAX_LEN)
    .regex(Constraints.ID_PATTERN, "Invalid ID format"),

  /** Session ID from Stripe (cs_test_xxx, cs_live_xxx) */
  sessionId: z.string().min(1).max(128),

  /** Email (basic) */
  email: z.string().email().max(255).optional().nullable(),

  /** Positive integer in range */
  quantity: z.coerce.number().int().min(1).max(20),
};
