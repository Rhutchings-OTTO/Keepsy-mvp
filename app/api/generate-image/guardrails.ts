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
  free: 2,
  paid: 25,
};

const MIN_INTERVAL_MS = 10_000; // 1 generation per 10 seconds

export function getClientKey(req: Request): string {
  const visitorId = req.headers.get("x-visitor-id")?.trim();
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const fallback = req.headers.get("x-real-ip") || "anonymous";
  return visitorId || forwardedFor || fallback;
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

function checkRequestAllowedMemory(clientKey: string, tier: UserTier): GuardResult {
  const now = Date.now();
  const dayKey = new Date().toISOString().slice(0, 10);
  const current = usageByKey.get(clientKey);

  if (!current || current.dayKey !== dayKey) {
    usageByKey.set(clientKey, { dayKey, usedToday: 0, lastRequestAtMs: 0 });
  }

  const usage = usageByKey.get(clientKey)!;

  if (now - usage.lastRequestAtMs < MIN_INTERVAL_MS) {
    const waitSeconds = Math.ceil((MIN_INTERVAL_MS - (now - usage.lastRequestAtMs)) / 1000);
    return { ok: false, status: 429, error: `Calibrating — please allow ${waitSeconds}s before your next generation.` };
  }

  if (usage.usedToday >= DAILY_CAP[tier]) {
    return { ok: false, status: 429, error: `Daily generation limit reached. You've used your ${DAILY_CAP[tier]} free designs for today. Come back tomorrow or purchase a design to continue.` };
  }

  // Update cooldown timestamp only — usedToday increments on success
  usage.lastRequestAtMs = now;
  usageByKey.set(clientKey, usage);
  return { ok: true, tier };
}

function incrementUsedTodayMemory(clientKey: string): void {
  const dayKey = new Date().toISOString().slice(0, 10);
  const usage = usageByKey.get(clientKey);
  if (usage && usage.dayKey === dayKey) {
    usage.usedToday += 1;
    usageByKey.set(clientKey, usage);
  }
}

async function checkRequestAllowedSupabase(clientKey: string, fallbackTier: UserTier): Promise<GuardResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const tier = fallbackTier;
    return checkRequestAllowedMemory(clientKey, tier);
  }

  const tier = await getUserTierFromDb(clientKey, fallbackTier);
  const { data, error } = await supabase.rpc("check_request_allowed", {
    p_user_key: clientKey,
    p_tier: tier,
    p_min_interval_ms: MIN_INTERVAL_MS,
    p_daily_cap: DAILY_CAP[tier],
  });

  if (error || !data || data.length === 0) {
    return checkRequestAllowedMemory(clientKey, tier);
  }

  const row = data[0] as { allowed: boolean; error: string | null };
  if (!row.allowed) {
    const limitMsg = row.error?.toLowerCase().includes("interval")
      ? row.error
      : `You've used your ${DAILY_CAP[tier]} free designs for today. Come back tomorrow or purchase a design to continue.`;
    return { ok: false, status: 429, error: limitMsg };
  }
  return { ok: true, tier };
}

async function incrementUsedTodaySupabase(clientKey: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    incrementUsedTodayMemory(clientKey);
    return;
  }
  const { error } = await supabase.rpc("increment_used_today", { p_user_key: clientKey });
  if (error) {
    // Fall back to in-memory increment so we don't silently drop the count
    incrementUsedTodayMemory(clientKey);
  }
}

export async function checkRequestAllowed(req: Request): Promise<GuardResult> {
  const clientKey = getClientKey(req);
  return checkRequestAllowedSupabase(clientKey, "free");
}

export async function incrementUsedToday(req: Request): Promise<void> {
  const clientKey = getClientKey(req);
  await incrementUsedTodaySupabase(clientKey);
}

export function sanitizePrompt(input: string): { ok: true; prompt: string } | { ok: false; error: string } {
  const trimmed = input.trim().slice(0, 600);
  if (!trimmed) return { ok: false, error: "Prompt cannot be empty." };
  return { ok: true, prompt: trimmed };
}

export async function fetchWithBackoff(
  url: string,
  init: RequestInit,
  options?: { retries?: number; timeoutMs?: number }
): Promise<Response> {
  const retries = options?.retries ?? 3;
  const timeoutMs = options?.timeoutMs ?? 25_000;
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
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
