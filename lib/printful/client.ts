/**
 * Printful API v1 client.
 * Docs: https://developers.printful.com/docs/
 */

const PRINTFUL_BASE = "https://api.printful.com";

function getToken(): string {
  const token = process.env.PRINTFUL_API_TOKEN;
  if (!token) throw new Error("PRINTFUL_API_TOKEN is not set");
  return token;
}

async function printfulFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${PRINTFUL_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const json = await res.json() as { code: number; result: T; error?: { message: string } };

  if (!res.ok || json.code >= 400) {
    throw new Error(
      `Printful API error (${json.code}): ${json.error?.message ?? JSON.stringify(json)}`
    );
  }

  return json.result;
}

export type PrintfulRecipient = {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state_code?: string;
  country_code: string;
  zip: string;
  email?: string;
  phone?: string;
};

export type PrintfulOrderItem = {
  /** Printful catalog variant ID */
  variant_id: number;
  quantity: number;
  files: Array<{
    url: string;
    /** 'default' for front, 'back' for back, etc. */
    type?: string;
  }>;
};

export type PrintfulCreateOrderRequest = {
  recipient: PrintfulRecipient;
  items: PrintfulOrderItem[];
  /** Set to false to place a real order, true for draft */
  confirm?: boolean;
  retail_costs?: {
    currency: string;
    subtotal: string;
    shipping: string;
    tax: string;
    total: string;
  };
  external_id?: string;
};

export type PrintfulOrder = {
  id: number;
  external_id: string;
  status: string;
  shipping: string;
  created: number;
  updated: number;
};

export async function createPrintfulOrder(
  order: PrintfulCreateOrderRequest
): Promise<PrintfulOrder> {
  return printfulFetch<PrintfulOrder>("/orders", {
    method: "POST",
    body: JSON.stringify(order),
  });
}

export async function getPrintfulOrder(orderId: number): Promise<PrintfulOrder> {
  return printfulFetch<PrintfulOrder>(`/orders/${orderId}`);
}

export async function confirmPrintfulOrder(orderId: number): Promise<PrintfulOrder> {
  return printfulFetch<PrintfulOrder>(`/orders/${orderId}/confirm`, {
    method: "POST",
  });
}
