/**
 * Shared frame + inline styles for CRM emails. Mirrors the brand style of
 * lib/emails/orderEmails.tsx (Georgia stand-in for Fraunces; email clients
 * won't load web fonts), cream background, terracotta accents.
 *
 * Every marketing/onboarding email renders through <EmailFrame>, so the
 * unsubscribe footer with the recipient's token link is never optional.
 */
import * as React from "react";
import { SUPPORT_EMAIL } from "@/lib/crm/site";

export const styles = {
  base: {
    fontFamily: "'Georgia', Georgia, serif",
    backgroundColor: "#FDF6EE",
    color: "#2D2926",
    margin: 0,
    padding: "40px 20px",
  },
  container: { maxWidth: 520, margin: "0 auto" },
  eyebrow: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.22em",
    textTransform: "uppercase" as const,
    color: "#C4714A",
    marginBottom: 12,
  },
  heading: {
    fontFamily: "'Georgia', Georgia, serif",
    fontSize: 26,
    fontWeight: 700,
    color: "#2D2926",
    margin: "0 0 20px",
    lineHeight: 1.2,
  },
  body: {
    fontSize: 15,
    lineHeight: 1.7,
    color: "rgba(45,41,38,0.78)",
    margin: "0 0 20px",
  },
  button: {
    display: "inline-block",
    backgroundColor: "#2C4A3E",
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 600,
    padding: "12px 28px",
    borderRadius: 10,
    textDecoration: "none",
    marginBottom: 28,
  },
  divider: { borderTop: "1px solid rgba(45,41,38,0.10)", margin: "28px 0" },
  meta: {
    fontSize: 12,
    color: "rgba(45,41,38,0.55)",
    lineHeight: 1.6,
    margin: "0 0 8px",
  },
  sig: { fontSize: 13, color: "rgba(45,41,38,0.45)", marginTop: 20 },
  tile: {
    backgroundColor: "#ffffff",
    border: "1px solid rgba(45,41,38,0.08)",
    borderRadius: 12,
    padding: "14px 16px",
    marginBottom: 10,
  },
  tileTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#2C4A3E",
    margin: "0 0 4px",
  },
  tileBody: {
    fontSize: 13,
    lineHeight: 1.6,
    color: "rgba(45,41,38,0.7)",
    margin: 0,
  },
  link: { color: "#C4714A" },
} as const;

export type FrameProps = {
  eyebrow: string;
  title: string;
  preheader?: string | null;
  /** Human confirm page (never auto-unsubscribes on GET). */
  unsubscribeUrl: string;
  /** Why they are getting this — shown in the footer, no fake claims. */
  reason: string;
  children: React.ReactNode;
};

export function EmailFrame({
  eyebrow,
  title,
  preheader,
  unsubscribeUrl,
  reason,
  children,
}: FrameProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width" />
        <title>{title}</title>
      </head>
      <body style={styles.base}>
        {preheader ? (
          <div
            style={{
              display: "none",
              maxHeight: 0,
              overflow: "hidden",
              opacity: 0,
              color: "transparent",
            }}
          >
            {preheader}
          </div>
        ) : null}
        <div style={styles.container}>
          <p style={styles.eyebrow}>{eyebrow}</p>
          <h1 style={styles.heading}>{title}</h1>
          {children}
          <hr style={styles.divider} />
          <p style={styles.meta}>{reason}</p>
          <p style={styles.meta}>
            <a href={unsubscribeUrl} style={styles.link}>
              Unsubscribe
            </a>{" "}
            with one click, or reply to this email and we&rsquo;ll do it for
            you. Order updates for anything you buy are always sent regardless.
          </p>
          <p style={styles.meta}>Keepsy &middot; {SUPPORT_EMAIL}</p>
          <p style={styles.sig}>&mdash; The Keepsy team</p>
        </div>
      </body>
    </html>
  );
}

/** Plain-text footer used by every template's text alternative. */
export function textFooter(reason: string, unsubscribeUrl: string): string {
  return [
    "",
    "--",
    reason,
    `Unsubscribe: ${unsubscribeUrl}`,
    "Order updates for anything you buy are always sent regardless.",
    `Keepsy · ${SUPPORT_EMAIL}`,
  ].join("\n");
}

export function formatLongDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}
