/**
 * Shared Printify fulfilment pipeline.
 *
 * Used by the Stripe webhook (first attempt) AND the Inngest retry/reconcile
 * functions, so a retried order prints exactly like a first-attempt order.
 *
 * Every paid line is fulfilled: one Printify product per distinct
 * (product, colour, size, print image) and ONE Printify order carrying all
 * line items with their quantities.
 *
 * Safety rails:
 *  - refuses to run twice for an order that already has a printify_order_id
 *  - refuses print sources that are not Keepsy-hosted (SSRF)
 *  - an ambiguous order submit (timeout / 5xx after Printify may have accepted
 *    it) is recorded as `submit_uncertain` so automatic retries never create a
 *    duplicate physical order; an operator resolves it against external_id
 *  - every critical DB write is checked; failures alert the founders with the
 *    Printify ids so nothing is lost
 *
 * Server-only (sharp, Printify token).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import {
  uploadImageToPrintify,
  createPrintifyProduct,
  submitPrintifyOrderLines,
  type PrintifyAddress,
  type PrintifyLineItem,
} from "@/lib/printify";
import { getPrintifyVariantId, getProductRegionKey } from "@/lib/printify-blueprints";
import { checkVariant } from "@/lib/commerce/variants";
import { isAllowedImageSourceUrl } from "@/lib/storage/allowedImageHosts";
import { isStorageUrl } from "@/lib/storage/supabaseStorage";
import { fetchPrintSourceBuffer } from "@/lib/fulfilment/fetchPrintSource";
import { notifyFounders } from "@/lib/notifications";
import {
  compositePostcardImage,
  compositeCardpackImage,
  compositeUSCardImage,
  compositeMugImage,
  computeContainScale,
  TEE_PRINT_W,
  TEE_PRINT_H,
  HOODIE_PRINT_W,
  HOODIE_PRINT_H,
} from "@/lib/image-composite";

export type FulfilmentLine = {
  productId: string;
  size?: string | null;
  color?: string | null;
  quantity: number;
  /** https URL of the print source for this line (Keepsy-hosted). */
  designUrl: string;
  /** Canvas only: https URL of the customer's crop. */
  croppedImageUrl?: string | null;
  sourceKind?: "ai" | "original" | null;
};

export type FulfilledLine = {
  productId: string;
  size: string | null;
  color: string | null;
  quantity: number;
  printifyImageId: string;
  printifyProductId: string;
  variantId: number;
};

export type FulfilmentResult = {
  printifyOrderId: string;
  lines: FulfilledLine[];
  /** True when the order had already been submitted earlier and nothing was re-sent. */
  alreadyFulfilled?: boolean;
};

/** Thrown when Printify may or may not have accepted the order — MUST NOT be auto-retried. */
export class SubmitUncertainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SubmitUncertainError";
  }
}

export const PRINTIFY_STATUS_SUBMIT_UNCERTAIN = "submit_uncertain";

const KNOWN_PRODUCT_PREFIXES = ["tee", "hoodie", "mug", "postcard", "cardpack", "uscard", "canvas"];

export function isKnownProductId(productId: string): boolean {
  const p = productId.toLowerCase();
  return KNOWN_PRODUCT_PREFIXES.some((k) => p === k || p.startsWith(`${k}_`));
}

/** Validate every line before touching Printify, so a bad line halts the whole order for review. */
export function validateLines(lines: FulfilmentLine[], region: "US" | "UK"): string[] {
  const problems: string[] = [];
  lines.forEach((line, i) => {
    if (!isKnownProductId(line.productId)) {
      problems.push(`line ${i + 1}: unknown product id "${line.productId}"`);
      return;
    }
    if (!line.designUrl || !/^https:\/\//.test(line.designUrl)) {
      problems.push(`line ${i + 1}: missing https design URL`);
    } else if (!isAllowedImageSourceUrl(line.designUrl)) {
      problems.push(`line ${i + 1}: design URL is not Keepsy-hosted`);
    }
    if (line.croppedImageUrl && !isAllowedImageSourceUrl(line.croppedImageUrl)) {
      problems.push(`line ${i + 1}: crop URL is not Keepsy-hosted`);
    }
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      problems.push(`line ${i + 1}: invalid quantity ${line.quantity}`);
    }
    const check = checkVariant({ productId: line.productId, color: line.color, size: line.size, region });
    if (!check.ok) problems.push(`line ${i + 1}: ${check.reason}`);
  });
  return problems;
}

function printSourceFor(line: FulfilmentLine): string {
  // Only canvas uses the customer's crop; every other product prints the full design.
  if (line.productId.toLowerCase().startsWith("canvas") && line.croppedImageUrl) return line.croppedImageUrl;
  return line.designUrl;
}

/**
 * Prepare and upload the print image for one line. Returns the Printify image
 * id and, for apparel, the contain-fit scale override.
 */
export async function prepareLineImage(
  line: FulfilmentLine,
  fileName: string
): Promise<{ printifyImageId: string; scaleOverride?: number }> {
  const pType = line.productId.toLowerCase();
  const sourceUrl = printSourceFor(line);

  if (pType === "postcard") {
    const buf = await compositePostcardImage(sourceUrl);
    return { printifyImageId: await uploadImageToPrintify(buf, fileName) };
  }
  if (pType === "cardpack") {
    const buf = await compositeCardpackImage(sourceUrl);
    return { printifyImageId: await uploadImageToPrintify(buf, fileName) };
  }
  if (pType.startsWith("uscard")) {
    const buf = await compositeUSCardImage(sourceUrl);
    return { printifyImageId: await uploadImageToPrintify(buf, fileName) };
  }
  if (pType === "mug") {
    const buf = await compositeMugImage(sourceUrl);
    return { printifyImageId: await uploadImageToPrintify(buf, fileName) };
  }
  if (pType === "tee" || pType === "hoodie") {
    // Keepsy-hosted only, timeout + size cap, PNG/JPEG guaranteed.
    const imgBuf = await fetchPrintSourceBuffer(sourceUrl);
    const meta = await sharp(imgBuf).metadata();
    let scaleOverride: number | undefined;
    if (meta.width && meta.height) {
      scaleOverride =
        pType === "tee"
          ? computeContainScale(meta.width, meta.height, TEE_PRINT_W, TEE_PRINT_H) * 0.8
          : computeContainScale(meta.width, meta.height, HOODIE_PRINT_W, HOODIE_PRINT_H);
    }
    return { printifyImageId: await uploadImageToPrintify(imgBuf, fileName), scaleOverride };
  }
  // Canvas: Printify fetches public Cloudinary URLs directly; private Storage objects are sent as bytes.
  if (isStorageUrl(sourceUrl)) {
    const buf = await fetchPrintSourceBuffer(sourceUrl);
    return { printifyImageId: await uploadImageToPrintify(buf, fileName) };
  }
  return { printifyImageId: await uploadImageToPrintify(sourceUrl, fileName) };
}

function isAmbiguousSubmitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /timeout|timed out|Printify API error 5\d\d|ECONNRESET|socket hang up|fetch failed/i.test(msg);
}

async function checkedUpdate(
  supabase: SupabaseClient | null | undefined,
  orderRef: string,
  patch: Record<string, unknown>,
  context: string
): Promise<boolean> {
  if (!supabase) return true;
  const { error } = await supabase.from("orders").update(patch).eq("order_ref", orderRef);
  if (error) {
    console.error(`[printify] (${orderRef}) DB update failed (${context}):`, error.message);
    notifyFounders(
      `Order ${orderRef}: database write failed after Printify call`,
      `Context: ${context}\nError: ${error.message}\nValues: ${JSON.stringify(patch)}\nAction: reconcile manually in Supabase — Printify has been called.`,
      "critical"
    ).catch(() => {});
    return false;
  }
  return true;
}

/**
 * Fulfil all lines of an order. Throws on the first hard failure AFTER
 * validation; the caller marks the order for manual review.
 */
export async function fulfilOrderLines(args: {
  orderRef: string;
  region: "US" | "UK";
  lines: FulfilmentLine[];
  address: PrintifyAddress;
  supabase?: SupabaseClient | null;
  log?: (msg: string) => void;
}): Promise<FulfilmentResult> {
  const { orderRef, region, lines, address, supabase } = args;
  const log = args.log ?? ((m: string) => console.log(m));

  // Idempotency: never submit twice for the same order.
  if (supabase) {
    const { data: existing, error: readError } = await supabase
      .from("orders")
      .select("printify_order_id, printify_status, fulfilment")
      .eq("order_ref", orderRef)
      .maybeSingle();
    if (readError || !existing) throw new SubmitUncertainError(`Cannot verify the fulfilment state of ${orderRef}; no print order was submitted.`);
    if (existing?.printify_order_id) {
      log(`[printify] (${orderRef}) already submitted as ${existing.printify_order_id} — skipping`);
      const stored = (existing.fulfilment as { lines?: FulfilledLine[] } | null)?.lines ?? [];
      return { printifyOrderId: String(existing.printify_order_id), lines: stored, alreadyFulfilled: true };
    }
    if ([PRINTIFY_STATUS_SUBMIT_UNCERTAIN, "fulfilling"].includes(existing?.printify_status)) {
      throw new SubmitUncertainError(
        `Order ${orderRef} is in '${PRINTIFY_STATUS_SUBMIT_UNCERTAIN}' — a previous submit may have reached Printify. ` +
          `Check Printify for external_id=${orderRef} before retrying.`
      );
    }
  }

  const problems = validateLines(lines, region);
  if (problems.length > 0) {
    throw new Error(`Refusing to fulfil ${orderRef}: ${problems.join("; ")}`);
  }

  if (supabase) {
    // Compare-and-set locks this order across webhook, cron and operator retries.
    const { data: claimed, error } = await supabase.from("orders")
      .update({ printify_status: "fulfilling" })
      .eq("order_ref", orderRef)
      .is("printify_order_id", null)
      .or("printify_status.is.null,printify_status.not.in.(fulfilling,submit_uncertain)")
      .select("order_ref").maybeSingle();
    if (error || !claimed) throw new SubmitUncertainError(`Order ${orderRef} could not be claimed exclusively; no print order was submitted.`);
  }

  const fulfilled: FulfilledLine[] = [];
  const printifyLineItems: PrintifyLineItem[] = [];
  const imageCache = new Map<string, { printifyImageId: string; scaleOverride?: number }>();

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const productId = line.productId.toLowerCase();
    const cacheKey = `${productId}|${printSourceFor(line)}`;
    let image = imageCache.get(cacheKey);
    if (!image) {
      log(`[printify] (${orderRef}) preparing image for line ${i + 1}: ${productId}`);
      image = await prepareLineImage(line, `keepsy-${orderRef}-${i + 1}.png`);
      imageCache.set(cacheKey, image);
    }

    const { config, variantId } = getPrintifyVariantId(productId, region, line.color ?? undefined, line.size ?? undefined);
    const printifyProductId = await createPrintifyProduct({
      title: `Keepsy ${productId}${line.size ? ` ${line.size}` : ""}${line.color ? ` ${line.color}` : ""} — ${orderRef}`,
      blueprintId: config.blueprintId,
      printProviderId: config.printProviderId,
      variantId,
      printImageId: image.printifyImageId,
      printPosition: config.printPosition,
      productType: productId,
      scaleOverride: image.scaleOverride,
    });

    fulfilled.push({
      productId,
      size: line.size ?? null,
      color: line.color ?? null,
      quantity: line.quantity,
      printifyImageId: image.printifyImageId,
      printifyProductId,
      variantId,
    });
    printifyLineItems.push({ product_id: printifyProductId, variant_id: variantId, quantity: line.quantity });

    if (i === 0) {
      // Legacy single-product columns keep pointing at the first line.
      await checkedUpdate(
        supabase,
        orderRef,
        {
          printify_image_id: image.printifyImageId,
          printify_product_id: printifyProductId,
          product_type: productId,
          variant_size: line.size ?? null,
          variant_color: line.color ?? null,
          region,
        },
        "product_created"
      );
    }
  }

  log(`[printify] (${orderRef}) submitting order with ${printifyLineItems.length} line item(s)`);
  let printifyOrderId: string;
  // Persist uncertainty BEFORE sending. A process kill after acceptance must never permit a duplicate.
  const protectedSubmit = await checkedUpdate(supabase, orderRef, { printify_status: PRINTIFY_STATUS_SUBMIT_UNCERTAIN }, "before_order_submit");
  if (!protectedSubmit) throw new SubmitUncertainError(`Unable to protect order ${orderRef} from duplicate submission; nothing was submitted.`);
  try {
    printifyOrderId = await submitPrintifyOrderLines({ externalId: orderRef, lineItems: printifyLineItems, shippingAddress: address });
  } catch (err) {
    if (isAmbiguousSubmitError(err)) {
      // Printify may have accepted the order. Freeze automatic retries.
      await checkedUpdate(supabase, orderRef, { printify_status: PRINTIFY_STATUS_SUBMIT_UNCERTAIN }, "submit_uncertain");
      throw new SubmitUncertainError(
        `Printify order submit for ${orderRef} timed out or failed after send (${err instanceof Error ? err.message : String(err)}). ` +
          `Check Printify for external_id=${orderRef} before retrying.`
      );
    }
    throw err;
  }

  // Write the critical id FIRST in its own statement, so it survives a schema mismatch on the other columns.
  await checkedUpdate(
    supabase,
    orderRef,
    { printify_order_id: printifyOrderId, printify_status: "sent_to_printify" },
    `printify_order_id=${printifyOrderId}`
  );
  await checkedUpdate(
    supabase,
    orderRef,
    { status: "in_production", fulfilment: { provider: "printify", printifyOrderId, lines: fulfilled } },
    "in_production"
  );

  return { printifyOrderId, lines: fulfilled };
}

/** Region for a Printify blueprint lookup, exported for tests. */
export function regionKeyFor(productId: string, region: "US" | "UK") {
  return getProductRegionKey(productId, region);
}
