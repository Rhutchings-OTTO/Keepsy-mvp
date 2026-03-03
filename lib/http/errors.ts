/**
 * Standard error responses. Never expose stack traces to clients in production.
 */

export const ErrorCodes = {
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  INVALID_ORIGIN: "INVALID_ORIGIN",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

const CODE_TO_STATUS: Record<ErrorCode, number> = {
  [ErrorCodes.BAD_REQUEST]: 400,
  [ErrorCodes.UNAUTHORIZED]: 401,
  [ErrorCodes.FORBIDDEN]: 403,
  [ErrorCodes.NOT_FOUND]: 404,
  [ErrorCodes.RATE_LIMITED]: 429,
  [ErrorCodes.PAYLOAD_TOO_LARGE]: 413,
  [ErrorCodes.VALIDATION_FAILED]: 400,
  [ErrorCodes.INVALID_ORIGIN]: 403,
  [ErrorCodes.INTERNAL_ERROR]: 500,
};

export type ApiErrorShape = {
  error: {
    code: ErrorCode;
    message: string;
  };
};

export function toErrorResponse(
  code: ErrorCode,
  message: string,
  options?: { retryAfter?: number }
): { body: ApiErrorShape; status: number; headers: Record<string, string> } {
  const status = CODE_TO_STATUS[code];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (code === ErrorCodes.RATE_LIMITED && options?.retryAfter != null) {
    headers["Retry-After"] = String(Math.ceil(options.retryAfter));
  }
  return {
    body: { error: { code, message } },
    status,
    headers,
  };
}

export function safeInternalMessage(): string {
  return process.env.NODE_ENV === "production"
    ? "An error occurred. Please try again later."
    : "Internal server error (see logs).";
}
