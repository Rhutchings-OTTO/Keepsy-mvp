/**
 * Atelier email HTML templates.
 * Use with Resend: resend.emails.send({ react: AtelierCreationEmail({ ... }) })
 */

import * as React from "react";
import { ATELIER_EMAILS, type AtelierEmailParams } from "@/content/atelierEmails";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://keepsy.store";

const baseStyles = {
  fontFamily: "'Georgia', serif",
  backgroundColor: "#F9F8F6",
  color: "#1A1A1A",
};

export function AtelierCreationEmail(params: AtelierEmailParams = {}) {
  const { subject, heroAssetUrl, heroAssetAlt, body } = ATELIER_EMAILS.creation;
  return (
    <html>
      <body style={{ ...baseStyles, margin: 0, padding: "40px 20px" }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
            {subject}
          </h1>
          <img
            src={heroAssetUrl}
            alt={heroAssetAlt}
            style={{ width: "100%", borderRadius: 12, marginBottom: 24 }}
          />
          <p style={{ fontSize: 16, lineHeight: 1.6, color: "rgba(26,26,26,0.85)" }}>
            {params.customerName && (
              <>
                Hello {params.customerName},
                <br />
                <br />
              </>
            )}
            {body(params)}
          </p>
          <p style={{ marginTop: 32, fontSize: 12, color: "rgba(26,26,26,0.5)" }}>
            — The Keepsy Atelier
          </p>
        </div>
      </body>
    </html>
  );
}

export function AtelierCraftEmail(params: AtelierEmailParams = {}) {
  const { subject, heroAssetUrl, heroAssetAlt, body } = ATELIER_EMAILS.craft;
  return (
    <html>
      <body style={{ ...baseStyles, margin: 0, padding: "40px 20px" }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
            {subject}
          </h1>
          <img
            src={heroAssetUrl}
            alt={heroAssetAlt}
            style={{ width: "100%", borderRadius: 12, marginBottom: 24 }}
          />
          <p style={{ fontSize: 16, lineHeight: 1.6, color: "rgba(26,26,26,0.85)" }}>
            {params.customerName && (
              <>
                Hello {params.customerName},
                <br />
                <br />
              </>
            )}
            {body(params)}
          </p>
          <p style={{ marginTop: 32, fontSize: 12, color: "rgba(26,26,26,0.5)" }}>
            — The Keepsy Atelier
          </p>
        </div>
      </body>
    </html>
  );
}
