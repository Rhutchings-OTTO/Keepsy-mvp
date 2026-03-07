/**
 * Printify API service layer.
 *
 * All requests include the mandatory User-Agent: NodeJS header.
 * Rate-limit (429) responses are retried automatically with backoff.
 */

const PRINTIFY_API = "https://api.printify.com/v1";

function getShopId(): string {
  const id = process.env.PRINTIFY_SHOP_ID;
  if (!id) throw new Error("PRINTIFY_SHOP_ID is not set");
  return id;
}

function getToken(): string {
  const token = process.env.PRINTIFY_API_TOKEN;
  if (!token) throw new Error("PRINTIFY_API_TOKEN is not set");
  return token;
}

function buildHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getToken()}`,
    "User-Agent": "NodeJS",
    "Content-Type": "application/json",
  };
}

async function printifyFetch(
  path: string,
  options?: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    let res: Response;
    try {
      res = await fetch(`${PRINTIFY_API}${path}`, {
        ...options,
        headers: {
          ...buildHeaders(),
          ...(options?.headers ?? {}),
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`Printify API timeout after 30s on ${path}`);
      }
      throw err;
    }

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("Retry-After") ?? "5", 10);
      const wait = (retryAfter + attempt) * 1000;
      await new Promise((r) => setTimeout(r, wait));
      lastError = new Error(`Printify rate limit (attempt ${attempt + 1})`);
      continue;
    }

    return res;
  }

  throw lastError ?? new Error("Printify API request failed after retries");
}

async function printifyJSON<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await printifyFetch(path, options);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Printify API error ${res.status} on ${path}: ${body.slice(0, 300)}`
    );
  }
  return res.json() as Promise<T>;
}

/* ─── Types ──────────────────────────────────────────────────────────────── */

export type PrintifyAddress = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  country: string;
  region?: string; // state/county code
  address1: string;
  address2?: string;
  city: string;
  zip: string;
};

export type PrintifyImageUpload = {
  id: string;
  file_name: string;
  mime_type: string;
  preview_url: string;
  upload_time: string;
};

export type PrintifyProduct = {
  id: string;
  title: string;
  variants: Array<{ id: number; price: number; is_enabled: boolean }>;
};

export type PrintifyOrder = {
  id: string;
  status: string;
  external_id: string;
  shipments?: Array<{
    carrier: string;
    number: string;
    url: string;
    delivered_at?: string;
  }>;
};

export type PrintifyShippingRate = {
  id: string;
  title: string;
  price: number; // cents
  currency: string;
};

/* ─── 1. Upload image ─────────────────────────────────────────────────────── */

/**
 * Upload a design image URL to the Printify media library.
 * Returns the Printify image ID (used in createProduct).
 */
export async function uploadImageToPrintify(
  imageUrl: string,
  fileName: string
): Promise<string> {
  const data = await printifyJSON<PrintifyImageUpload>(
    "/uploads/images.json",
    {
      method: "POST",
      body: JSON.stringify({ file_name: fileName, url: imageUrl }),
    }
  );
  return data.id;
}

/* ─── 2. Create product ───────────────────────────────────────────────────── */

/**
 * Create a one-off product on Printify with the uploaded design.
 * Returns the Printify product ID.
 */
export async function createPrintifyProduct(params: {
  title: string;
  blueprintId: number;
  printProviderId: number;
  variantId: number;
  printImageId: string;
  printPosition: string;
  productType: string;
}): Promise<string> {
  const { title, blueprintId, printProviderId, variantId, printImageId, printPosition, productType } = params;

  const isMug = productType.includes("mug");
  const scale = isMug ? 0.65 : 1;

  const body = {
    title,
    description: "Custom AI keepsake from Keepsy",
    blueprint_id: blueprintId,
    print_provider_id: printProviderId,
    variants: [{ id: variantId, price: 100, is_enabled: true }],
    print_areas: [
      {
        variant_ids: [variantId],
        placeholders: [
          {
            position: printPosition,
            images: [
              {
                id: printImageId,
                x: 0.5,
                y: 0.5,
                scale,
                angle: 0,
              },
            ],
          },
        ],
      },
    ],
  };

  const product = await printifyJSON<PrintifyProduct>(
    `/shops/${getShopId()}/products.json`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );

  return product.id;
}

/* ─── 3. Submit order ─────────────────────────────────────────────────────── */

/**
 * Submit a fulfilment order to Printify.
 * Returns the Printify order ID.
 */
export async function submitPrintifyOrder(params: {
  externalId: string;
  productId: string;
  variantId: number;
  quantity: number;
  shippingAddress: PrintifyAddress;
  sendShippingNotification?: boolean;
}): Promise<string> {
  const {
    externalId,
    productId,
    variantId,
    quantity,
    shippingAddress,
    sendShippingNotification = false,
  } = params;

  const body = {
    external_id: externalId,
    line_items: [
      {
        product_id: productId,
        variant_id: variantId,
        quantity,
      },
    ],
    shipping_method: 1,
    send_shipping_notification: sendShippingNotification,
    address_to: shippingAddress,
  };

  const order = await printifyJSON<PrintifyOrder>(
    `/shops/${getShopId()}/orders.json`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );

  return order.id;
}

/* ─── 4. Get order ─────────────────────────────────────────────────────────── */

export async function getPrintifyOrder(orderId: string): Promise<PrintifyOrder> {
  return printifyJSON<PrintifyOrder>(
    `/shops/${getShopId()}/orders/${orderId}.json`
  );
}

/* ─── 5. Calculate shipping ───────────────────────────────────────────────── */

export async function calculatePrintifyShipping(params: {
  blueprintId: number;
  printProviderId: number;
  variantId: number;
  quantity: number;
  address: PrintifyAddress;
}): Promise<PrintifyShippingRate[]> {
  const { blueprintId, printProviderId, variantId, quantity, address } = params;

  const body = {
    line_items: [
      {
        blueprint_id: blueprintId,
        variant_id: variantId,
        print_provider_id: printProviderId,
        quantity,
      },
    ],
    address_to: address,
  };

  type ShippingResponse = { standard: PrintifyShippingRate[] };
  const data = await printifyJSON<ShippingResponse>(
    `/shops/${getShopId()}/orders/shipping.json`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );

  return data.standard ?? [];
}

/* ─── 6. Delete product (used in tests/cleanup) ─────────────────────────── */

export async function deletePrintifyProduct(productId: string): Promise<void> {
  const res = await printifyFetch(
    `/shops/${getShopId()}/products/${productId}.json`,
    { method: "DELETE" }
  );
  if (!res.ok && res.status !== 404) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to delete Printify product ${productId}: ${body.slice(0, 200)}`);
  }
}

/* ─── Helper: split full name ─────────────────────────────────────────────── */

export function splitName(fullName: string): { first_name: string; last_name: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { first_name: parts[0], last_name: parts[0] };
  const first_name = parts.slice(0, -1).join(" ");
  const last_name = parts[parts.length - 1];
  return { first_name, last_name };
}
