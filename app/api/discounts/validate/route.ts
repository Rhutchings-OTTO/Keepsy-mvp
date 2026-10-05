/**
 * POST /api/discounts/validate — preview a welcome code against the basket.
 *
 * Does NOT lock or redeem anything; the checkout route re-validates and
 * locks. Returns only what the cart needs to display. Rate limited and
 * origin-guarded like every other state-adjacent endpoint.
 */
import Stripe from "stripe";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUser } from "@/lib/supabase/server";
import { getCountry } from "@/lib/commerce/markets";
import { isValidEmail } from "@/lib/commerce/discounts";
import { resolveDiscount } from "@/lib/commerce/discountServer";
import { PRODUCT_CATALOG } from "@/lib/commerce/catalog";
import {
  guardOrigin,
  guardRateLimit,
  getRequestId,
} from "@/lib/security/withSecurity";
import { parseAndValidate } from "@/lib/http/validate";

export const dynamic = "force-dynamic";
export const runtime = "edge";

const JSON_HEADERS = { "Content-Type": "application/json" };

let _stripe: Stripe | null = null;
function getStripe(): Stripe | null {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    _stripe = new Stripe(key, { apiVersion: "2026-02-25.clover" });
  }
  return _stripe;
}

const schema = z
  .object({
    code: z.string().min(4).max(40),
    email: z.string().max(255),
    destinationCountry: z.string().length(2),
    cart: z
      .array(
        z.object({
          productId: z
            .string()
            .max(64)
            .regex(/^[a-zA-Z0-9_-]+$/),
          quantity: z.number().int().min(1).max(20),
          unitPrice: z.number().positive(),
        }),
      )
      .min(1)
      .max(40),
  })
  .strict();

function json(
  body: unknown,
  status: number,
  extra: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extra },
  });
}

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const originDeny = guardOrigin(req, "/api/discounts/validate", requestId);
  if (originDeny) return originDeny;
  const rl = await guardRateLimit(
    req,
    "/api/discounts/validate",
    "POST",
    requestId,
  );
  if ("response" in rl) return rl.response;

  const parsed = await parseAndValidate(req, schema, 32 * 1024);
  if ("error" in parsed) return json(parsed.error, parsed.status);
  const body = parsed.data;

  const country = getCountry(body.destinationCountry);
  if (!country || !country.enabled) {
    return json(
      {
        ok: false,
        reason: "market",
        message: "Choose a delivery country we ship to first.",
      },
      400,
      rl.headers,
    );
  }
  if (!isValidEmail(body.email)) {
    return json(
      {
        ok: false,
        reason: "email_required",
        message: "Enter the email address you signed up with.",
      },
      400,
      rl.headers,
    );
  }
  const db = getSupabaseAdmin();
  if (!db)
    return json(
      {
        ok: false,
        reason: "unavailable",
        message: "Discount codes can't be checked right now.",
      },
      503,
      rl.headers,
    );

  // Only known catalogue ids take part; prices are re-derived server-side at checkout anyway.
  const lines = body.cart
    .filter((l) => PRODUCT_CATALOG[l.productId])
    .map((l) => {
      const p = PRODUCT_CATALOG[l.productId];
      const unitPrice =
        country.currency === "usd" ? (p.priceUSD ?? p.priceGBP) : p.priceGBP;
      return { productId: l.productId, quantity: l.quantity, unitPrice };
    });

  const user = await getSessionUser();
  const result = await resolveDiscount({
    db,
    stripe: getStripe(),
    code: body.code,
    email: body.email,
    userId: user?.id ?? null,
    market: country.market,
    currency: country.currency,
    lines,
  });
  if (!result.ok)
    return json(
      { ok: false, reason: result.reason, message: result.message },
      result.status === 503 ? 503 : 200,
      rl.headers,
    );

  const d = result.discount;
  if (d.kind === "welcome") {
    const v = d.validation;
    return json(
      {
        ok: true,
        kind: "welcome",
        code: v.code,
        percent: v.percent,
        discountAmount: v.discountAmount,
        eligibleSubtotal: v.eligibleSubtotal,
        excludedSubtotal: v.excludedSubtotal,
        conditions: v.conditions,
        currency: country.currency,
      },
      200,
      rl.headers,
    );
  }
  return json(
    {
      ok: true,
      kind: "stripe_promotion",
      code: d.code,
      percent: d.percent,
      discountAmount: d.discountAmount,
      eligibleSubtotal: lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
      excludedSubtotal: 0,
      conditions: d.conditions,
      currency: country.currency,
    },
    200,
    rl.headers,
  );
}
