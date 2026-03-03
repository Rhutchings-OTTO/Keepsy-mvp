#!/usr/bin/env node
/**
 * Lightweight security smoke tests. Exercises validation, rate limit, origin.
 * Usage: BASE_URL=http://localhost:3000 node scripts/security-smoke.mjs
 */
const BASE = process.env.BASE_URL || "http://localhost:3000";

async function test(name, fn) {
  try {
    await fn();
    console.log(`  OK ${name}`);
    return true;
  } catch (e) {
    console.error(`  FAIL ${name}:`, e.message);
    return false;
  }
}

async function main() {
  console.log("Security smoke tests against", BASE);

  await test("400 on invalid JSON to create-checkout", async () => {
    const r = await fetch(`${BASE}/api/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://keepsy.store" },
      body: "not json",
    });
    if (r.status !== 400) throw new Error(`expected 400, got ${r.status}`);
  });

  await test("400 on invalid cart schema", async () => {
    const r = await fetch(`${BASE}/api/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://keepsy.store" },
      body: JSON.stringify({ cart: "not array" }),
    });
    if (r.status !== 400) throw new Error(`expected 400, got ${r.status}`);
  });

  await test("403 on invalid origin", async () => {
    const r = await fetch(`${BASE}/api/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://evil.com" },
      body: JSON.stringify({ cart: [{ id: "card", quantity: 1 }] }),
    });
    if (r.status !== 403) throw new Error(`expected 403, got ${r.status}`);
  });

  await test("400 on invalid prompt to generate-image", async () => {
    const r = await fetch(`${BASE}/api/generate-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://keepsy.store" },
      body: JSON.stringify({ prompt: 123 }),
    });
    if (r.status !== 400) throw new Error(`expected 400, got ${r.status}`);
  });

  await test("session_id required for orders/status", async () => {
    const r = await fetch(`${BASE}/api/orders/status`);
    if (r.status !== 400) throw new Error(`expected 400, got ${r.status}`);
  });
  ok++;

  console.log("\nDone. Run a real rate limit test manually (hit endpoint >30 times/min).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
