import { recordOrderEvent } from "@/lib/orders/events";
/**
 * Stripe checkout session creation.
 * ALWAYS returns JSON (success or error).
 *
 * Server-authoritative:
 *  - prices come from lib/commerce/catalog.ts; variants are validated against
 *    the Printify blueprint maps; every line's print source is persisted to
 *    `order_items` so the webhook can fulfil EVERY line.
 *  - the DESTINATION COUNTRY chosen by the customer decides currency,
 *    shipping and whether we can sell at all; Stripe is told to accept that
 *    single country for the shipping address, and the webhook refuses to
 *    fulfil if Stripe's collected country differs.
 *  - shipping is a Stripe shipping option quoted by lib/commerce/shipping.ts.
 *  - the welcome discount is validated + locked here and applied as a one-off
 *    Stripe coupon for exactly the eligible amount (no promo-code box at
 *    Stripe, so no unrestricted codes can be typed there).
 *  - explicit marketing consent from OUR checkout step is stored on the order
 *    (never inferred from the purchase).
 *
 * Required Vercel env vars:
 * - STRIPE_SECRET_KEY
 * - NEXT_PUBLIC_SITE_URL or SITE_URL (for redirects)
 * Optional: Supabase for order persistence/discounts; Supabase auth for ownership.
 */
import Stripe from "stripe";
import { z } from "zod";
import { sha256Hex } from "@/lib/crypto/sha256";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUser } from "@/lib/supabase/server";
import { roundMoney, type Currency } from "@/lib/commerce/pricing";
import { priceCart } from "@/lib/commerce/checkoutPricing";
import { getCountry } from "@/lib/commerce/markets";
import { quoteShipping } from "@/lib/commerce/shipping";
import { fulfilmentRegionForOrder } from "@/lib/commerce/routes";
import { isValidEmail } from "@/lib/commerce/discounts";
import {
  lockWelcomeCode,
  resolveDiscount,
  releaseWelcomeLock,
} from "@/lib/commerce/discountServer";
import { isConsentTextVersion } from "@/lib/crm/consentText";
import {
  guardOrigin,
  guardRateLimit,
  getRequestId,
} from "@/lib/security/withSecurity";
import { parseAndValidate, schemas } from "@/lib/http/validate";

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

const httpsUrl = z
  .string()
  .url()
  .max(2048)
  .refine((u) => u.startsWith("https://"), "Must be an https URL");

const lineItemSchema = z.object({
  productId: z
    .string()
    .max(64)
    .regex(/^[a-zA-Z0-9_-]+$/),
  name: z.string().max(200),
  color: z.string().max(64).optional(),
  size: z.string().max(16).optional(),
  /** Legacy boolean flag ("1") or a short https URL; never a data URL. */
  imageUrl: z.string().max(2048).optional(),
  /** Permanent https print source for THIS line. */
  designUrl: httpsUrl.optional(),
  croppedImageUrl: httpsUrl.optional(),
  sourceKind: z.enum(["ai", "original"]).optional(),
  addonId: z.string().max(32).optional(),
  unitPrice: z.number().positive(),
  quantity: schemas.quantity,
});

export type CheckoutLineInput = z.infer<typeof lineItemSchema>;

const checkoutSchema = z
  .object({
    cart: z.array(lineItemSchema).min(1).max(40),
    /** Optional client hint; the server derives currency from the destination and rejects mismatches. */
    currency: z.enum(["gbp", "usd"]).optional(),
    destinationCountry: z.string().length(2),
    discountCode: z.string().max(40).optional(),
    discountEmail: z.string().max(255).optional(),
    marketingConsent: z.boolean().optional(),
    consentTextVersion: z.string().max(40).optional(),
    imageDataUrl: z.string().max(256).optional(),
    designUrl: httpsUrl.optional(),
    croppedImageUrl: httpsUrl.optional(),
    productType: z.string().max(64).optional(),
  })
  .strict();

type CheckoutRequest = z.infer<typeof checkoutSchema>;

function getBaseUrl() {
  const configuredSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (!configuredSiteUrl) {
    if (process.env.NODE_ENV !== "production") {
      return "http://127.0.0.1:3000";
    }
    throw new Error(
      "NEXT_PUBLIC_SITE_URL or SITE_URL is required for checkout redirects.",
    );
  }
  return configuredSiteUrl.replace(/\/$/, "");
}

function json(
  body: unknown,
  status: number,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const originDeny = guardOrigin(
    req,
    "/api/create-checkout-session",
    requestId,
  );
  if (originDeny) return originDeny;
  const rateLimitResult = await guardRateLimit(
    req,
    "/api/create-checkout-session",
    "POST",
    requestId,
  );
  if ("response" in rateLimitResult) return rateLimitResult.response;

  let pendingDiscountRef: string | null = null;
  let sessionAttempted = false;
  try {
    const stripe = getStripe();
    if (!stripe) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
          "[checkout] STRIPE_SECRET_KEY is missing. Add it to .env.local (local) or Vercel env vars (production).",
        );
      }
      return json(
        {
          error: "CHECKOUT_FAILED",
          message:
            "Payment is not configured. Add STRIPE_SECRET_KEY to your environment variables.",
        },
        500,
      );
    }

    const CHECKOUT_MAX_BYTES = 128 * 1024;
    const parsed = await parseAndValidate(
      req,
      checkoutSchema,
      CHECKOUT_MAX_BYTES,
    );
    if ("error" in parsed) return json(parsed.error, parsed.status);
    const body = parsed.data;

    // ── Destination decides currency, shipping and sellability ───────────────
    const country = getCountry(body.destinationCountry);
    if (!country || !country.enabled) {
      return json(
        {
          error: "DESTINATION_UNAVAILABLE",
          message:
            "We don't deliver to that country yet. Choose another delivery country.",
        },
        400,
      );
    }
    const currency: Currency = country.currency;
    if (body.currency && body.currency !== currency) {
      return json(
        {
          error: "CURRENCY_MISMATCH",
          message: `Prices for ${country.name} are in ${currency.toUpperCase()}. Please refresh your basket.`,
        },
        400,
      );
    }

    const priced = priceCart(body.cart as CheckoutRequest["cart"], currency, {
      designUrl: body.designUrl,
      croppedImageUrl: body.croppedImageUrl,
    });
    if (!priced.ok)
      return json(
        { error: priced.error, message: priced.message },
        priced.status,
      );
    const lines = priced.lines;

    const shipping = quoteShipping({
      lines: lines.map((l) => ({
        productId: l.id,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
      })),
      destinationCountry: country.code,
    });
    if (!shipping.ok) {
      const error =
        shipping.reason === "product_unavailable"
          ? "PRODUCT_UNAVAILABLE"
          : "DESTINATION_UNAVAILABLE";
      return json(
        {
          error,
          message: shipping.message,
          details: {
            unavailableProductIds: shipping.unavailableProductIds ?? [],
          },
        },
        400,
      );
    }
    // Every line must have an evidenced provider route for this destination.
    const fulfilmentRegion = fulfilmentRegionForOrder(
      lines.map((l) => l.id),
      country.code,
    );
    if (!fulfilmentRegion) {
      return json(
        {
          error: "PRODUCT_UNAVAILABLE",
          message: `Some items can't be made for delivery to ${country.name} yet.`,
        },
        400,
      );
    }

    const totalGBP = roundMoney(
      lines.reduce((sum, item) => sum + item.priceGBP * item.quantity, 0),
    );
    const subtotal = roundMoney(
      lines.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    );
    if (subtotal <= 0) return json({ error: "Invalid cart total." }, 400);

    // Canvas orders MUST include a size — otherwise fulfilment cannot pick a variant.
    const canvasMissingSize = lines.find(
      (item) =>
        item.id.startsWith("canvas") && !(item.size && item.size.trim()),
    );
    if (canvasMissingSize) {
      return json(
        {
          error: "MISSING_CANVAS_SIZE",
          message: `Canvas orders require a size selection (${canvasMissingSize.name}).`,
        },
        400,
      );
    }
    const linesWithoutDesign = lines.filter((l) => !l.designUrl);
    if (linesWithoutDesign.length > 0) {
      return json(
        {
          error: "MISSING_PRINT_IMAGE",
          message:
            "Please add a design or upload a photo for every item before checkout.",
        },
        400,
      );
    }

    let baseUrl: string;
    try {
      baseUrl = getBaseUrl();
    } catch (e) {
      if (process.env.NODE_ENV !== "production")
        console.error("[checkout] SITE_URL missing:", (e as Error).message);
      return json(
        {
          error: "CHECKOUT_FAILED",
          message:
            "Redirect URL not configured. Set NEXT_PUBLIC_SITE_URL or SITE_URL (e.g. https://keepsy.store).",
        },
        500,
      );
    }

    const primaryProductName = lines[0]?.name || "Keepsy order";
    const orderRef = `order_${globalThis.crypto.randomUUID()}`;
    const primaryDesignUrl = body.designUrl ?? lines[0]?.designUrl ?? "";
    const primaryCroppedUrl =
      body.croppedImageUrl ?? lines[0]?.croppedImageUrl ?? "";
    const productType = lines[0]?.id ?? body.productType ?? primaryProductName;

    // Signed-in customers own their orders; guests check out exactly as before.
    const user = await getSessionUser();
    const supabase = getSupabaseAdmin();
    if (!supabase)
      return json(
        {
          error: "CHECKOUT_UNAVAILABLE",
          message: "We couldn't save your order. Please try again shortly.",
        },
        503,
      );
    const now = new Date();

    // ── Welcome discount (validated + locked server-side) ────────────────────
    let discountLine: {
      code: string;
      kind: "welcome" | "stripe_promotion";
      amount: number;
      percent: number;
      coupon?: string;
      promotionCode?: string;
    } | null = null;
    let lockedEmail: string | null = user?.email ?? null;
    if (body.discountCode && body.discountCode.trim()) {
      const email = (body.discountEmail ?? user?.email ?? "")
        .trim()
        .toLowerCase();
      if (!isValidEmail(email)) {
        return json(
          {
            error: "DISCOUNT_EMAIL_REQUIRED",
            message: "Enter the email address your welcome code was sent to.",
          },
          400,
        );
      }
      if (!supabase) {
        return json(
          {
            error: "DISCOUNT_UNAVAILABLE",
            message:
              "Discount codes can't be applied right now. Remove the code to continue.",
          },
          503,
        );
      }
      const resolved = await resolveDiscount({
        db: supabase,
        stripe,
        code: body.discountCode,
        email,
        userId: user?.id ?? null,
        market: country.market,
        currency,
        lines: lines.map((l) => ({
          productId: l.id,
          unitPrice: l.unitPrice,
          quantity: l.quantity,
        })),
        orderRef,
        now,
      });
      if (!resolved.ok) {
        return json(
          {
            error: "DISCOUNT_INVALID",
            reason: resolved.reason,
            message: resolved.message,
          },
          resolved.status,
        );
      }
      if (resolved.discount.kind === "welcome") {
        pendingDiscountRef = orderRef;
        const locked = await lockWelcomeCode(
          supabase,
          resolved.discount.validation.code,
          orderRef,
          now,
        );
        if (!locked) {
          return json(
            {
              error: "DISCOUNT_INVALID",
              reason: "in_use",
              message:
                "That code is being used in another checkout right now. Try again in an hour.",
            },
            409,
          );
        }
        const amount = resolved.discount.validation.discountAmount;
        const coupon = await stripe.coupons.create(
          {
            amount_off: Math.round(amount * 100),
            currency,
            duration: "once",
            max_redemptions: 1,
            name: `Welcome ${resolved.discount.validation.percent}% off`,
            metadata: {
              order_ref: orderRef,
              code: resolved.discount.validation.code,
              kind: "welcome",
            },
          },
          { idempotencyKey: `coupon_${orderRef}` },
        );
        discountLine = {
          code: resolved.discount.validation.code,
          kind: "welcome",
          amount,
          percent: resolved.discount.validation.percent,
          coupon: coupon.id,
        };
        await supabase
          .from("discount_codes")
          .update({ stripe_coupon_id: coupon.id })
          .eq("code", resolved.discount.validation.code);
      } else {
        discountLine = {
          code: resolved.discount.code,
          kind: "stripe_promotion",
          amount: resolved.discount.discountAmount,
          percent: resolved.discount.percent,
          promotionCode: resolved.discount.promotionCodeId,
        };
      }
      // The code is bound to this email: lock it on the Stripe session so it cannot be changed at payment.
      lockedEmail = email;
    }

    // ── Marketing consent: only an explicit decision from a shown checkbox ──
    const consentShown =
      typeof body.marketingConsent === "boolean" &&
      isConsentTextVersion(body.consentTextVersion);
    const consentPatch = consentShown
      ? {
          marketing_consent: body.marketingConsent as boolean,
          consent_text_version: body.consentTextVersion as string,
          consent_recorded_at: now.toISOString(),
        }
      : {};

    const idempotencySource = JSON.stringify({
      orderRef,
      lines,
      totalGBP,
      date: now.toISOString().slice(0, 10),
    });
    const idempotencyKey = (await sha256Hex(idempotencySource)).slice(0, 32);

    if (supabase) {
      const { error: orderInsertError } = await supabase.from("orders").upsert(
        {
          order_ref: orderRef,
          stripe_session_id: `pending_${orderRef}`,
          status: "pending",
          currency,
          total_gbp: totalGBP,
          prompt: "",
          generated_image_url: primaryDesignUrl || null,
          cropped_image_url: primaryCroppedUrl || null,
          destination_country: country.code,
          market: country.market,
          region: fulfilmentRegion,
          checkout_email: lockedEmail,
          subtotal_amount: subtotal,
          shipping_amount: shipping.amount,
          discount_code: discountLine?.code ?? null,
          discount_amount: discountLine?.amount ?? null,
          discount_kind: discountLine?.kind ?? null,
          ...consentPatch,
          ...(user ? { user_id: user.id } : {}),
        },
        { onConflict: "order_ref" },
      );

      if (orderInsertError) {
        throw new Error("Could not save the order before payment.");
      } else {
        await supabase.from("order_items").delete().eq("order_ref", orderRef);
        const { error: itemInsertError } = await supabase
          .from("order_items")
          .insert(
            lines.map((item) => ({
              order_ref: orderRef,
              product_name:
                [item.name, item.size, item.color]
                  .filter(Boolean)
                  .join(" · ") || item.name,
              quantity: item.quantity,
              unit_price_gbp: item.priceGBP,
              line_total_gbp: roundMoney(item.priceGBP * item.quantity),
              product_id: item.id,
              size: item.size ?? null,
              color: item.color ?? null,
              design_url: item.designUrl ?? null,
              cropped_image_url: item.croppedImageUrl ?? null,
              source_kind: item.sourceKind ?? null,
              addon_id: item.addonId ?? null,
            })),
          );
        if (itemInsertError)
          throw new Error("Could not save all order items before payment.");
      }
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      // NOTE: Klarna and Clearpay must be enabled in the Stripe Dashboard under
      // Settings > Payment methods before they will appear at checkout.
      payment_method_types: ["card", "klarna", "afterpay_clearpay"],
      billing_address_collection: "required",
      // The customer chose the destination on our site; Stripe only accepts that country.
      shipping_address_collection: {
        allowed_countries: [
          country.code as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry,
        ],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: Math.round(shipping.amount * 100),
              currency,
            },
            display_name:
              shipping.amount === 0
                ? `Free ${shipping.label.toLowerCase()}`
                : shipping.label,
            delivery_estimate: {
              minimum: {
                unit: "business_day",
                value: shipping.etaBusinessDays.min,
              },
              maximum: {
                unit: "business_day",
                value: shipping.etaBusinessDays.max,
              },
            },
          },
        },
      ],
      ...(lockedEmail ? { customer_email: lockedEmail } : {}),
      ...(discountLine?.coupon
        ? { discounts: [{ coupon: discountLine.coupon }] }
        : {}),
      ...(discountLine?.promotionCode
        ? { discounts: [{ promotion_code: discountLine.promotionCode }] }
        : {}),
      // Keep the discount lock and the session lifetime aligned.
      ...(discountLine
        ? { expires_at: Math.floor(now.getTime() / 1000) + 60 * 60 }
        : {}),
      line_items: lines.map((item) => {
        // Stripe metadata values are capped at 500 chars; Cloudinary URLs are ~130.
        const meta: Record<string, string> = {
          productId: item.id,
          color: item.color ?? "",
          size: item.size ?? "",
          designUrl: (item.designUrl ?? "").slice(0, 490),
          croppedImageUrl: (item.croppedImageUrl ?? "").slice(0, 490),
          sourceKind: item.sourceKind ?? "",
          addonId: item.addonId ?? "",
        };
        return {
          price_data: {
            currency,
            product_data: {
              name:
                [item.name, item.size, item.color]
                  .filter(Boolean)
                  .join(" · ") || item.name,
              description:
                item.sourceKind === "original"
                  ? "Your photo, printed as it is"
                  : "Custom keepsake print",
              metadata: meta,
            },
            unit_amount: Math.round(item.unitPrice * 100),
          },
          quantity: item.quantity,
        };
      }),
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/create?canceled=1`,
      metadata: {
        order_ref: orderRef,
        primary_product: primaryProductName,
        has_image:
          body.imageDataUrl || lines.some((l) => l.designUrl) ? "1" : "0",
        design_url: primaryDesignUrl.slice(0, 490),
        cropped_image_url: primaryCroppedUrl.slice(0, 490),
        product_type: productType,
        variant_size: lines[0]?.size ?? "",
        variant_color: lines[0]?.color ?? "",
        line_count: String(lines.length),
        destination_country: country.code,
        market: country.market,
        fulfilment_region: fulfilmentRegion,
        shipping_amount: String(shipping.amount),
        ...(discountLine
          ? {
              discount_code: discountLine.code,
              discount_kind: discountLine.kind,
              discount_amount: String(discountLine.amount),
            }
          : {}),
        ...(consentShown
          ? {
              marketing_consent: body.marketingConsent ? "opt_in" : "opt_out",
              consent_text_version: body.consentTextVersion as string,
            }
          : {}),
        ...(user ? { user_id: user.id } : {}),
      },
      client_reference_id: orderRef,
    };

    // An interrupted response may still have created a payable session. Keep
    // its discount reservation until expiry rather than permit a second use.
    sessionAttempted = true;
    const session = await stripe.checkout.sessions.create(sessionParams, {
      idempotencyKey,
    });
    if (supabase) {
      await supabase
        .from("orders")
        .update({ stripe_session_id: session.id })
        .eq("order_ref", orderRef);
      await recordOrderEvent(supabase, {
        orderRef,
        type: "checkout_created",
        source: "system",
        idempotencyKey: session.id,
        data: { destination: country.code, currency },
      });
    }

    return json(
      { url: session.url, sessionId: session.id, orderRef },
      200,
      rateLimitResult.headers,
    );
  } catch (err: unknown) {
    if (pendingDiscountRef && !sessionAttempted) {
      const db = getSupabaseAdmin();
      if (db) await releaseWelcomeLock(db, pendingDiscountRef);
    }
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[checkout] Stripe session creation failed:", errMsg);
    return json(
      {
        error: "CHECKOUT_FAILED",
        message: "Checkout couldn't start. Please try again.",
      },
      500,
    );
  }
}
