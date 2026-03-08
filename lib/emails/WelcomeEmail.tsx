/**
 * Welcome email sent to new subscribers with their unique discount code.
 * Matches the Keepsy Atelier brand style used in orderEmails.tsx.
 */
import * as React from "react";

// ─── Shared styles (mirrors orderEmails.tsx) ──────────────────────────────────

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

// ─── Welcome Email ────────────────────────────────────────────────────────────

export type WelcomeEmailProps = {
  discountCode: string;
  siteUrl: string;
};

export function WelcomeEmail({ discountCode, siteUrl }: WelcomeEmailProps) {
  return (
    <html>
      <body style={base}>
        <div style={container}>
          <p style={eyebrow}>Welcome</p>
          <h1 style={heading}>Thanks for joining the Keepsy family.</h1>
          <p style={body}>
            We&rsquo;re so glad you&rsquo;re here. As promised, here&rsquo;s your exclusive
            10% discount on your first order. Use the code below at checkout:
          </p>

          {/* Discount code box */}
          <div
            style={{
              backgroundColor: "#F5EDE0",
              borderRadius: 12,
              padding: "24px 28px",
              textAlign: "center",
              marginBottom: 28,
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(45,41,38,0.5)",
                margin: "0 0 12px",
              }}
            >
              Your exclusive discount code
            </p>
            <p
              style={{
                fontFamily: "'Georgia', Georgia, serif",
                fontSize: 34,
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "#C4714A",
                margin: "0 0 10px",
              }}
            >
              {discountCode}
            </p>
            <p
              style={{
                fontSize: 12,
                color: "rgba(45,41,38,0.45)",
                margin: 0,
              }}
            >
              10% off your first order &middot; single use
            </p>
          </div>

          <a href={`${siteUrl}/create`} style={badge}>
            Start Creating
          </a>

          <p style={body}>
            We&rsquo;ll keep you in the loop with new designs, gifting ideas, and seasonal
            inspiration. No spam &mdash; just the good stuff.
          </p>

          <hr style={divider} />
          <p style={meta}>
            You&rsquo;re receiving this because you signed up at keepsy.store.{" "}
            <a href="mailto:hello@keepsy.store?subject=unsubscribe" style={{ color: "#C4714A" }}>
              Unsubscribe
            </a>{" "}
            at any time.
          </p>
          <p style={sig}>— The Keepsy Atelier</p>
        </div>
      </body>
    </html>
  );
}
