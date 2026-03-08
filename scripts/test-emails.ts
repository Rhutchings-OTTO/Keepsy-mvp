/**
 * Test all four transactional email templates.
 *
 * Usage:
 *   npx tsx scripts/test-emails.ts
 *
 * Requires: RESEND_API_KEY in .env.local
 * Sends to:  FOUNDER_EMAIL_1 in .env.local (fallback: rory@keepsy.store)
 */

import * as path from "path";
import * as fs from "fs";

// ── Load env ──────────────────────────────────────────────────────────────────

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.local"));
loadEnvFile(path.resolve(process.cwd(), ".env.production"));

// ── Run ───────────────────────────────────────────────────────────────────────

import {
  sendOrderConfirmationEmail,
  sendInProductionEmail,
  sendShippedEmail,
  sendDeliveredEmail,
} from "../lib/emails/orderEmails";

const TO = process.env.FOUNDER_EMAIL_1 || "rory@keepsy.store";

const PARAMS = {
  orderRef: "TEST-001",
  customerName: "Rory",
  productName: "Custom Hoodie",
  designPrompt: "a sunset over the ocean",
  trackingNumber: "1Z999AA10123456784",
  trackingUrl: "https://www.ups.com/track?tracknum=1Z999AA10123456784",
};

async function main() {
  console.log(`Sending test emails to: ${TO}\n`);

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  console.log("RESEND_API_KEY set:", !!process.env.RESEND_API_KEY);

  // 1. Order confirmation
  const r1 = await sendOrderConfirmationEmail({ to: TO, ...PARAMS });
  console.log("1. Order Confirmation:", r1.ok ? "✓ sent" : `✗ failed — ${r1.error}`);
  await wait(600);

  // 2. In production
  const r2 = await sendInProductionEmail({ to: TO, ...PARAMS });
  console.log("2. In Production:     ", r2 ? "✓ sent" : "✗ failed");
  await wait(600);

  // 3. Shipped
  const r3 = await sendShippedEmail({ to: TO, ...PARAMS });
  console.log("3. Shipped:           ", r3 ? "✓ sent" : "✗ failed");
  await wait(600);

  // 4. Delivered
  const r4 = await sendDeliveredEmail({ to: TO, ...PARAMS });
  console.log("4. Delivered:         ", r4 ? "✓ sent" : "✗ failed");

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Script failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
