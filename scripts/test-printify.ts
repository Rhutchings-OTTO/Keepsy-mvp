/**
 * Printify integration test script.
 *
 * Usage:
 *   npx tsx scripts/test-printify.ts
 *
 * What it does:
 *   1. Uploads a sample image to the Printify media library
 *   2. Creates a test product using mug blueprint (BP 68)
 *   3. Logs the product ID (verify in Printify dashboard)
 *   4. Logs the order payload that WOULD be submitted (does NOT place a real order)
 *   5. Deletes the test product to keep the account clean
 *
 * Requires: PRINTIFY_API_TOKEN and PRINTIFY_SHOP_ID in environment (or .env.production)
 */

import * as path from "path";
import * as fs from "fs";

// Load env manually (avoid dotenv dependency) — try .env.local first, then .env.production
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

const envLocal = path.resolve(process.cwd(), ".env.local");
const envProd = path.resolve(process.cwd(), ".env.production");
loadEnvFile(envLocal);
loadEnvFile(envProd);

// ── Minimal inline implementations (avoids Next.js module resolution issues) ─

const PRINTIFY_API = "https://api.printify.com/v1";

function getHeaders() {
  const token = process.env.PRINTIFY_API_TOKEN;
  if (!token) throw new Error("PRINTIFY_API_TOKEN is not set");
  return {
    Authorization: `Bearer ${token}`,
    "User-Agent": "NodeJS",
    "Content-Type": "application/json",
  };
}

function getShopId() {
  const id = process.env.PRINTIFY_SHOP_ID;
  if (!id) throw new Error("PRINTIFY_SHOP_ID is not set");
  return id;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const url = `${PRINTIFY_API}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Printify POST ${path} failed (${res.status}): ${text.slice(0, 400)}`);
  }
  return JSON.parse(text) as T;
}

async function apiDelete(path: string): Promise<void> {
  const url = `${PRINTIFY_API}${path}`;
  const res = await fetch(url, { method: "DELETE", headers: getHeaders() });
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`Printify DELETE ${path} failed (${res.status}): ${text.slice(0, 200)}`);
  }
}

// ── Test constants ────────────────────────────────────────────────────────────

// A publicly accessible test image that Printify can download
// Using picsum.photos which serves reliable JPG images
const TEST_IMAGE_URL = "https://picsum.photos/seed/keepsy-test/800/800.jpg";

const TEST_BLUEPRINT_ID = 68; // Generic Brand 11oz Mug (US)
const TEST_PROVIDER_ID = 1;   // SPOKE Custom Products
const TEST_VARIANT_ID = 33719; // 11oz

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Printify Integration Test ===\n");

  // 1. Upload image
  console.log("Step 1: Uploading test image to Printify...");
  const fileName = `keepsy-test-${Date.now()}.png`;

  type ImageUploadResponse = { id: string; file_name: string; preview_url: string };
  const upload = await apiPost<ImageUploadResponse>("/uploads/images.json", {
    file_name: fileName,
    url: TEST_IMAGE_URL,
  });

  console.log(`✓ Image uploaded`);
  console.log(`  ID:          ${upload.id}`);
  console.log(`  File name:   ${upload.file_name}`);
  console.log(`  Preview URL: ${upload.preview_url}\n`);

  // 2. Create product
  console.log("Step 2: Creating test product on Printify...");
  const productTitle = `[TEST — DELETE ME] Keepsy Mug ${Date.now()}`;

  type ProductResponse = { id: string; title: string };
  const product = await apiPost<ProductResponse>(
    `/shops/${getShopId()}/products.json`,
    {
      title: productTitle,
      description: "Automated test product — safe to delete",
      blueprint_id: TEST_BLUEPRINT_ID,
      print_provider_id: TEST_PROVIDER_ID,
      variants: [{ id: TEST_VARIANT_ID, price: 100, is_enabled: true }],
      print_areas: [
        {
          variant_ids: [TEST_VARIANT_ID],
          placeholders: [
            {
              position: "front",
              images: [
                {
                  id: upload.id,
                  x: 0.5,
                  y: 0.5,
                  scale: 1,
                  angle: 0,
                },
              ],
            },
          ],
        },
      ],
    }
  );

  console.log(`✓ Product created`);
  console.log(`  Product ID: ${product.id}`);
  console.log(`  Title:      ${product.title}`);
  console.log(`  → Verify at: https://app.printify.com/app/store/products/${product.id}\n`);

  // 3. Log what an order payload would look like (no real order submitted)
  console.log("Step 3: Order payload preview (NOT submitting — no charges)");
  const orderPayload = {
    external_id: "order_test_preview_001",
    line_items: [
      {
        product_id: product.id,
        variant_id: TEST_VARIANT_ID,
        quantity: 1,
      },
    ],
    shipping_method: 1,
    send_shipping_notification: false,
    address_to: {
      first_name: "Jane",
      last_name: "Smith",
      email: "jane@example.com",
      phone: "555-0100",
      country: "US",
      region: "CA",
      address1: "123 Main Street",
      city: "Los Angeles",
      zip: "90001",
    },
  };

  console.log("  Order payload would be:");
  console.log(JSON.stringify(orderPayload, null, 2));
  console.log();

  // 4. Clean up — delete the test product
  console.log("Step 4: Cleaning up — deleting test product...");
  await apiDelete(`/shops/${getShopId()}/products/${product.id}.json`);
  console.log(`✓ Test product ${product.id} deleted\n`);

  console.log("=== Test complete. Printify integration is working. ===");
}

main().catch((err) => {
  console.error("\n✗ Test failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
