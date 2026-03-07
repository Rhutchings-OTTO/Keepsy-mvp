/**
 * Atelier Email Sequence — Evolution of the Artifact
 * Used when order status progresses. Integrate with Resend, SendGrid, or similar.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://keepsy.store";

export type AtelierEmailType =
  | "confirmation"
  | "creation"
  | "production"
  | "craft"
  | "shipped"
  | "delivered";

export type AtelierEmailParams = {
  customerName?: string;
  designPrompt?: string;
  orderRef?: string;
};

const EMAIL_CONFIRMATION = {
  type: "confirmation" as const,
  subject: (orderRef?: string) =>
    `Thank you for your Keepsy order${orderRef ? ` — ${orderRef}` : ""}`,
  body: (params: AtelierEmailParams) =>
    params.designPrompt
      ? `Thank you for your order. We've received your '${params.designPrompt}' design and our studio is preparing to bring it to life.`
      : "Thank you for your order. Our studio is preparing to bring your design to life.",
};

const EMAIL_1_CREATION = {
  type: "creation" as const,
  subject: "Your vision is taking form.",
  /** Asset: sketching animation GIF — the "Sketching" effect */
  heroAssetUrl: `${SITE_URL}/email-assets/sketching-animation.gif`,
  /** Fallback if GIF not supported */
  heroAssetAlt: "Your design is being created",
  body: (params: AtelierEmailParams) =>
    params.designPrompt
      ? `We have received your prompt. Our machines are currently calibrating the pigment density for your '${params.designPrompt}' design.`
      : "We have received your prompt. Our machines are currently calibrating the pigment density for your design.",
};

const EMAIL_PRODUCTION = {
  type: "production" as const,
  subject: (orderRef?: string) =>
    `Your Keepsy order is being crafted${orderRef ? ` — ${orderRef}` : ""}`,
  body: (_params: AtelierEmailParams) =>
    "Your order has been sent to our print studio and is now in production. It's being printed on premium materials and carefully inspected before packing.",
};

const EMAIL_2_CRAFT = {
  type: "craft" as const,
  subject: "Quality check complete.",
  /** Asset: close-up high-res hoodie weave texture (from the Loupe) */
  heroAssetUrl: `${SITE_URL}/mockups/hoodie-weave-closeup.jpg`,
  heroAssetAlt: "Hoodie fabric weave — quality verified",
  body: (_params: AtelierEmailParams) =>
    "The ink has met the fabric. Our artisans have inspected the grain and confirmed the integrity of the design. It is now being prepared for transit.",
};

const EMAIL_SHIPPED = {
  type: "shipped" as const,
  subject: (orderRef?: string) =>
    `Your Keepsy order is on its way${orderRef ? ` — ${orderRef}` : ""}`,
  body: (_params: AtelierEmailParams) =>
    "Your order has left the studio and is heading to you.",
};

const EMAIL_DELIVERED = {
  type: "delivered" as const,
  subject: "Your Keepsy order has arrived — we'd love your thoughts",
  body: (_params: AtelierEmailParams) =>
    "Your order has been delivered. We hope it carries the meaning you intended and brings joy to whoever receives it. We'd love to hear how it turned out — simply reply to this email.",
};

export const ATELIER_EMAILS = {
  confirmation: EMAIL_CONFIRMATION,
  creation: EMAIL_1_CREATION,
  production: EMAIL_PRODUCTION,
  craft: EMAIL_2_CRAFT,
  shipped: EMAIL_SHIPPED,
  delivered: EMAIL_DELIVERED,
} as const;

/** Plain text versions for non-HTML clients */
export function getAtelierEmailPlain(
  type: AtelierEmailType,
  params: AtelierEmailParams = {}
): { subject: string; body: string } {
  const email = ATELIER_EMAILS[type];
  const subject =
    typeof email.subject === "function"
      ? (email.subject as (orderRef?: string) => string)(params.orderRef)
      : (email.subject as string);
  return {
    subject,
    body: [
      params.customerName ? `Hello ${params.customerName},` : "",
      "",
      email.body(params),
      "",
      "— The Keepsy Atelier",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}
