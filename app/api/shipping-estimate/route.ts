/**
 * Shipping estimate API route.
 *
 * POST /api/shipping-estimate
 *
 * Body:
 *   {
 *     productId: "card" | "mug" | "tee" | "hoodie",
 *     color?: string,
 *     size?: string,
 *     quantity?: number,   // default 1
 *     country: string,     // ISO 3166-1 alpha-2 (e.g. "US", "GB")
 *     region?: string,     // state/province code (e.g. "CA")
 *     zip: string,
 *     city?: string,
 *   }
 *
 * Returns:
 *   {
 *     rates: Array<{ id: string; title: string; price: number; currency: string }>
 *   }
 */

import { z } from "zod";
import { calculatePrintifyShipping } from "@/lib/printify";
import { getPrintifyVariantId } from "@/lib/printify-blueprints";
import { guardOrigin, guardRateLimit, getRequestId } from "@/lib/security/withSecurity";
import type { Region } from "@/lib/region";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ─── In-memory LRU cache for shipping rates ───────────────────────────────────
// TTL: 10 minutes. Max size: 50 entries (oldest evicted first).
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_SIZE = 50;

type CacheEntry = { rates: unknown; expiresAt: number };
// Map preserves insertion order, making LRU eviction straightforward.
const shippingCache = new Map<string, CacheEntry>();

function makeCacheKey(
  productId: string,
  country: string,
  zip: string,
  quantity: number,
  color: string | undefined,
  size: string | undefined
): string {
  return `${productId}|${country}|${zip}|${quantity}|${color ?? ""}|${size ?? ""}`;
}

function cacheGet(key: string): unknown | null {
  const entry = shippingCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    shippingCache.delete(key);
    return null;
  }
  // Refresh LRU position by re-inserting.
  shippingCache.delete(key);
  shippingCache.set(key, entry);
  return entry.rates;
}

function cacheSet(key: string, rates: unknown): void {
  // Evict oldest entry if at capacity.
  if (shippingCache.size >= CACHE_MAX_SIZE) {
    const oldestKey = shippingCache.keys().next().value;
    if (oldestKey !== undefined) shippingCache.delete(oldestKey);
  }
  shippingCache.set(key, { rates, expiresAt: Date.now() + CACHE_TTL_MS });
}
// ─────────────────────────────────────────────────────────────────────────────

const JSON_HEADERS = { "Content-Type": "application/json" };

const bodySchema = z.object({
  productId: z.string().max(64),
  color: z.string().max(64).optional(),
  size: z.string().max(16).optional(),
  quantity: z.number().int().min(1).max(20).optional().default(1),
  country: z.string().length(2),
  region: z.string().max(10).optional(),
  zip: z.string().max(20),
  city: z.string().max(100).optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email().max(200).optional(),
  address1: z.string().max(200).optional(),
});

export async function POST(req: Request): Promise<Response> {
  const requestId = getRequestId(req);
  const originDeny = guardOrigin(req, "/api/shipping-estimate", requestId);
  if (originDeny) return originDeny;

  const rateLimitResult = await guardRateLimit(req, "/api/shipping-estimate", "POST", requestId);
  if ("response" in rateLimitResult) return rateLimitResult.response;

  let body: z.infer<typeof bodySchema>;
  try {
    const json = await req.json();
    body = bodySchema.parse(json);
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  const printifyToken = process.env.PRINTIFY_API_TOKEN;
  if (!printifyToken) {
    return new Response(
      JSON.stringify({ error: "Shipping estimate unavailable" }),
      { status: 503, headers: JSON_HEADERS }
    );
  }

  try {
    const region: Region = body.country === "GB" ? "UK" : "US";
    const { config, variantId } = getPrintifyVariantId(
      body.productId,
      region,
      body.color,
      body.size
    );

    // Check cache before calling external API.
    const cacheKey = makeCacheKey(body.productId, body.country, body.zip, body.quantity, body.color, body.size);
    const cached = cacheGet(cacheKey);

    const rates = cached ?? await calculatePrintifyShipping({
      blueprintId: config.blueprintId,
      printProviderId: config.printProviderId,
      variantId,
      quantity: body.quantity,
      address: {
        first_name: body.firstName ?? "Customer",
        last_name: body.lastName ?? "Name",
        email: body.email ?? "customer@example.com",
        country: body.country,
        region: body.region,
        address1: body.address1 ?? "123 Main St",
        city: body.city ?? "Springfield",
        zip: body.zip,
      },
    });

    if (!cached) {
      cacheSet(cacheKey, rates);
    }

    const headers: Record<string, string> = {
      ...JSON_HEADERS,
      ...rateLimitResult.headers,
    };

    return new Response(JSON.stringify({ rates }), { status: 200, headers });
  } catch (err) {
    console.error(
      "[shipping-estimate]",
      err instanceof Error ? err.message : err
    );
    return new Response(
      JSON.stringify({ error: "Failed to calculate shipping" }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
}
