/**
 * Transactional order lifecycle email templates.
 * Used with Resend for in-production, shipped, and delivered notifications.
 */

import * as React from "react";
import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM || "Keepsy <hello@keepsy.store>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://keepsy.store";

// ─── Shared styles ────────────────────────────────────────────────────────────

const base = {
  fontFamily: "'Georgia', Georgia, serif",
  backgroundColor: "#F9F8F6",
  color: "#2D2926",
  margin: 0,
  padding: "40px 20px",
} as const;

const container = {
  maxWidth: 520,
  margin: "0 auto",
} as const;

const eyebrow = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.22em",
  textTransform: "uppercase" as const,
  color: "#C4714A",
  marginBottom: 12,
} as const;

const heading = {
  fontFamily: "'Georgia', Georgia, serif",
  fontSize: 26,
  fontWeight: 700,
  color: "#2D2926",
  margin: "0 0 20px",
  lineHeight: 1.2,
} as const;

const body = {
  fontSize: 15,
  lineHeight: 1.7,
  color: "rgba(45,41,38,0.75)",
  margin: "0 0 24px",
} as const;

const badge = {
  display: "inline-block",
  backgroundColor: "#2B4038",
  color: "#fff",
  fontSize: 14,
  fontWeight: 600,
  padding: "12px 28px",
  borderRadius: 10,
  textDecoration: "none",
  marginBottom: 28,
} as const;

const divider = {
  borderTop: "1px solid rgba(45,41,38,0.08)",
  margin: "28px 0",
} as const;

const meta = {
  fontSize: 13,
  color: "rgba(45,41,38,0.5)",
  lineHeight: 1.6,
} as const;

const sig = {
  fontSize: 13,
  color: "rgba(45,41,38,0.45)",
  marginTop: 24,
} as const;

// ─── In-production email ──────────────────────────────────────────────────────

export type InProductionEmailProps = {
  customerName?: string;
  orderRef: string;
  productName?: string;
};

export function InProductionEmail({ customerName, orderRef, productName }: InProductionEmailProps) {
  const trackUrl = `${SITE_URL}/track?ref=${orderRef}`;
  return (
    <html>
      <body style={base}>
        <div style={container}>
          <p style={eyebrow}>Order Update</p>
          <h1 style={heading}>Your creation is being made.</h1>
          <p style={body}>
            {customerName ? `Hi ${customerName}, ` : ""}
            Great news — your {productName ?? "Keepsy order"} has been sent to our print studio and is now in production.
            It&apos;s being printed on premium materials and carefully inspected before packing.
          </p>
          <a href={trackUrl} style={badge}>Track Your Order</a>
          <hr style={divider} />
          <p style={meta}>
            <strong>Order reference:</strong> {orderRef}
            <br />
            <strong>Estimated delivery:</strong> 5–10 business days
          </p>
          <p style={sig}>— The Keepsy team</p>
        </div>
      </body>
    </html>
  );
}

// ─── Shipped email ─────────────────────────────────────────────────────────────

export type ShippedEmailProps = {
  customerName?: string;
  orderRef: string;
  productName?: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
};

export function ShippedEmail({ customerName, orderRef, productName, trackingNumber, trackingUrl }: ShippedEmailProps) {
  const orderTrackUrl = `${SITE_URL}/track?ref=${orderRef}`;
  return (
    <html>
      <body style={base}>
        <div style={container}>
          <p style={eyebrow}>On Its Way</p>
          <h1 style={heading}>Your order has shipped! 🎉</h1>
          <p style={body}>
            {customerName ? `Hi ${customerName}, ` : ""}
            Your {productName ?? "Keepsy order"} has left the studio and is heading to you.
            {trackingNumber ? ` Your tracking number is ${trackingNumber}.` : ""}
          </p>
          {trackingUrl ? (
            <a href={trackingUrl} style={badge}>Track with Courier</a>
          ) : (
            <a href={orderTrackUrl} style={badge}>View Order Status</a>
          )}
          <hr style={divider} />
          <p style={meta}>
            <strong>Order reference:</strong> {orderRef}
            {trackingNumber && (
              <>
                <br />
                <strong>Tracking number:</strong> {trackingNumber}
              </>
            )}
          </p>
          <p style={sig}>— The Keepsy team</p>
        </div>
      </body>
    </html>
  );
}

// ─── Delivered email ───────────────────────────────────────────────────────────

export type DeliveredEmailProps = {
  customerName?: string;
  orderRef: string;
  productName?: string;
};

export function DeliveredEmail({ customerName, orderRef, productName }: DeliveredEmailProps) {
  const createUrl = `${SITE_URL}/create`;
  return (
    <html>
      <body style={base}>
        <div style={container}>
          <p style={eyebrow}>Delivered</p>
          <h1 style={heading}>Your order has arrived.</h1>
          <p style={body}>
            {customerName ? `Hi ${customerName}, ` : ""}
            Your {productName ?? "Keepsy order"} has been delivered. We hope it makes a wonderful memory.
            If you&apos;d like to create another keepsake, we&apos;d love to help.
          </p>
          <a href={createUrl} style={badge}>Create Another Design</a>
          <hr style={divider} />
          <p style={meta}>
            <strong>Order reference:</strong> {orderRef}
          </p>
          <p style={sig}>— The Keepsy team</p>
        </div>
      </body>
    </html>
  );
}

// ─── Send functions ────────────────────────────────────────────────────────────

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendInProductionEmail(params: InProductionEmailProps & { to: string }): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: `Your Keepsy order is in production — ${params.orderRef}`,
      react: InProductionEmail(params),
      text: `Your ${params.productName ?? "order"} is now in production. Track it at ${SITE_URL}/track?ref=${params.orderRef}`,
    });
    if (error) { console.error("[email] in-production send failed:", error); return false; }
    return true;
  } catch (e) {
    console.error("[email] in-production send error:", e);
    return false;
  }
}

export async function sendShippedEmail(params: ShippedEmailProps & { to: string }): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: `Your Keepsy order is on its way — ${params.orderRef}`,
      react: ShippedEmail(params),
      text: `Your ${params.productName ?? "order"} has shipped.${params.trackingNumber ? ` Tracking: ${params.trackingNumber}` : ""} View status: ${SITE_URL}/track?ref=${params.orderRef}`,
    });
    if (error) { console.error("[email] shipped send failed:", error); return false; }
    return true;
  } catch (e) {
    console.error("[email] shipped send error:", e);
    return false;
  }
}

export async function sendDeliveredEmail(params: DeliveredEmailProps & { to: string }): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: `Your Keepsy order has been delivered — ${params.orderRef}`,
      react: DeliveredEmail(params),
      text: `Your ${params.productName ?? "order"} has been delivered. Create another: ${SITE_URL}/create`,
    });
    if (error) { console.error("[email] delivered send failed:", error); return false; }
    return true;
  } catch (e) {
    console.error("[email] delivered send error:", e);
    return false;
  }
}
