/**
 * Server-side environment validation. FAIL-FAST on startup.
 * NEVER import this file in client components.
 */
import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  STRIPE_SECRET_KEY: z.string().optional().refine((v) => !v || v.startsWith("sk_"), "STRIPE_SECRET_KEY must start with sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().optional().refine((v) => !v || v.startsWith("whsec_"), "STRIPE_WEBHOOK_SECRET must start with whsec_"),
  OPENAI_API_KEY: z.string().optional().refine((v) => !v || v.startsWith("sk-"), "OPENAI_API_KEY must start with sk-"),
  NEXT_PUBLIC_SITE_URL: z.string().optional(),
  SITE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  MOCKUP_CALIBRATION_ENABLED: z.string().optional(),
  MOCKUP_CALIBRATION_KEY: z.string().optional(),
  PERF_DASHBOARD_KEY: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;

let _env: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (_env) return _env;
  const parsed = serverEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    SITE_URL: process.env.SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    MOCKUP_CALIBRATION_ENABLED: process.env.MOCKUP_CALIBRATION_ENABLED,
    MOCKUP_CALIBRATION_KEY: process.env.MOCKUP_CALIBRATION_KEY,
    PERF_DASHBOARD_KEY: process.env.PERF_DASHBOARD_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  if (!parsed.success) {
    const msg = parsed.error.issues.map((e) => e.path.join(".") + ": " + e.message).join("; ");
    throw new Error("[env] Validation failed: " + msg);
  }
  _env = parsed.data;
  return _env;
}
