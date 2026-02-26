type UserTier = "free" | "paid";
type GuardResult = { ok: true; tier: UserTier } | { ok: false; status: number; error: string };

type UsageRecord = {
  dayKey: string;
  usedToday: number;
  lastRequestAtMs: number;
};

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const usageByKey = new Map<string, UsageRecord>();

const DAILY_CAP: Record<UserTier, number> = {
  free: 3,
  paid: 25,
};

const MIN_INTERVAL_MS = 10_000; // 1 generation per 10 seconds

const BLOCKED_KEYWORDS = [
  "nude",
  "nudity",
  "explicit",
  "sexual",
  "porn",
  "gore",
  "bloodbath",
  "beheading",
  "violence",
  "kill",
  "hate symbol",
];

export function getClientKey(req: Request): string {
  const visitorId = req.headers.get("x-visitor-id")?.trim();
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const fallback = req.headers.get("x-real-ip") || "anonymous";
  return visitorId || forwardedFor || fallback;
}

function getUserTierFromHeader(req: Request): UserTier {
  const header = req.headers.get("x-user-tier");
  return header === "paid" ? "paid" : "free";
}

async function getUserTierFromDb(clientKey: string, fallbackTier: UserTier): Promise<UserTier> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return fallbackTier;

  const { data } = await supabase
    .from("user_profiles")
    .select("tier")
    .eq("user_key", clientKey)
    .maybeSingle();

  return data?.tier === "paid" ? "paid" : fallbackTier;
}

function enforceUsageGuardsMemory(clientKey: string, tier: UserTier): GuardResult {
  const now = Date.now();
  const dayKey = new Date().toISOString().slice(0, 10);
  const current = usageByKey.get(clientKey);

  if (!current || current.dayKey !== dayKey) {
    usageByKey.set(clientKey, { dayKey, usedToday: 0, lastRequestAtMs: 0 });
  }

  const usage = usageByKey.get(clientKey)!;

  if (now - usage.lastRequestAtMs < MIN_INTERVAL_MS) {
    const waitSeconds = Math.ceil((MIN_INTERVAL_MS - (now - usage.lastRequestAtMs)) / 1000);
    return { ok: false, status: 429, error: `Please wait ${waitSeconds}s before generating again.` };
  }

  if (usage.usedToday >= DAILY_CAP[tier]) {
    return { ok: false, status: 429, error: `Daily generation limit reached (${DAILY_CAP[tier]}).` };
  }

  usage.lastRequestAtMs = now;
  usage.usedToday += 1;
  usageByKey.set(clientKey, usage);
  return { ok: true, tier };
}

async function enforceUsageGuardsSupabase(clientKey: string, fallbackTier: UserTier): Promise<GuardResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const tier = fallbackTier;
    return enforceUsageGuardsMemory(clientKey, tier);
  }

  const tier = await getUserTierFromDb(clientKey, fallbackTier);
  const { data, error } = await supabase.rpc("check_and_increment_usage", {
    p_user_key: clientKey,
    p_tier: tier,
    p_min_interval_ms: MIN_INTERVAL_MS,
    p_daily_cap: DAILY_CAP[tier],
  });

  if (error || !data || data.length === 0) {
    return enforceUsageGuardsMemory(clientKey, tier);
  }

  const row = data[0] as { allowed: boolean; error: string | null };
  if (!row.allowed) {
    return { ok: false, status: 429, error: row.error || "Usage limit reached." };
  }
  return { ok: true, tier };
}

export async function enforceUsageGuards(req: Request): Promise<GuardResult> {
  const clientKey = getClientKey(req);
  const headerTier = getUserTierFromHeader(req);
  return enforceUsageGuardsSupabase(clientKey, headerTier);
}

export function sanitizePrompt(input: string): { ok: true; prompt: string } | { ok: false; error: string } {
  const trimmed = input.trim().slice(0, 600);
  if (!trimmed) return { ok: false, error: "Prompt cannot be empty." };

  const lower = trimmed.toLowerCase();
  const blocked = BLOCKED_KEYWORDS.find((word) => lower.includes(word));
  if (blocked) {
    return { ok: false, error: "Prompt contains blocked content. Please keep it family-friendly." };
  }

  const safePrompt =
    "Create a family-friendly, gift-ready artwork for merchandise printing. " +
    `${trimmed}. ` +
    "Avoid nudity, violence, hate symbols, deformed anatomy, text artifacts, blur, and watermarks.";

  return { ok: true, prompt: safePrompt };
}

export async function fetchWithBackoff(url: string, init: RequestInit, retries = 3): Promise<Response> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeout);
      if (response.status !== 429 || attempt === retries) return response;
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;
      if (attempt === retries) throw err;
    }

    const backoffMs = 1000 * 2 ** attempt + Math.floor(Math.random() * 350);
    await new Promise((resolve) => setTimeout(resolve, backoffMs));
  }

  throw lastError instanceof Error ? lastError : new Error("Image generation failed after retries.");
}
