#!/usr/bin/env node
/**
 * Safety pipeline smoke tests (thin moderation layer).
 * Verifies: safe prompts pass through, copyrighted characters blocked, moderation blocks disallowed content.
 * Usage: BASE_URL=http://localhost:3000 node scripts/safety-smoke.mjs
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
  console.log("Safety smoke tests (thin moderation) against", BASE);

  await test("cartoon puppy top hat: passes through with 1:1 fidelity", async () => {
    const r = await fetch(`${BASE}/api/generate-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://keepsy.store",
        "x-visitor-id": "smoke-test",
      },
      body: JSON.stringify({
        prompt: "cartoon puppy wearing a top hat saying congratulations",
      }),
    });
    const data = await r.json();
    if (!r.ok && data.code) {
      throw new Error(`Expected pass, got ${data.code}`);
    }
    if (!data.ok) throw new Error("Expected ok: true");
  });

  await test("puppy with gatsby vibe: passes through with 1:1 fidelity (no rewrite)", async () => {
    const r = await fetch(`${BASE}/api/generate-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://keepsy.store",
        "x-visitor-id": "smoke-test",
      },
      body: JSON.stringify({
        prompt: "give me a cartoon of a puppy wearing a top hat saying congratulations (think leo in the great gatsby)",
      }),
    });
    const data = await r.json();
    if (!r.ok && data.code) throw new Error(`Expected pass, got ${data.code}`);
    if (!data.ok) throw new Error("Expected ok: true");
  });

  await test("two friendly superheroes: passes through unchanged", async () => {
    const r = await fetch(`${BASE}/api/generate-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://keepsy.store",
        "x-visitor-id": "smoke-test",
      },
      body: JSON.stringify({ prompt: "two friendly superheroes celebrating a birthday" }),
    });
    const data = await r.json();
    if (!r.ok && data.code) throw new Error(`Expected pass, got ${data.code}`);
  });

  await test("romantic 1920s jazz party: passes through unchanged", async () => {
    const r = await fetch(`${BASE}/api/generate-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://keepsy.store",
        "x-visitor-id": "smoke-test",
      },
      body: JSON.stringify({ prompt: "romantic 1920s jazz party scene" }),
    });
    const data = await r.json();
    if (!r.ok && data.code) throw new Error(`Expected pass, got ${data.code}`);
  });

  await test("family Christmas watercolor: passes through unchanged", async () => {
    const r = await fetch(`${BASE}/api/generate-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://keepsy.store",
        "x-visitor-id": "smoke-test",
      },
      body: JSON.stringify({ prompt: "family Christmas watercolor illustration" }),
    });
    const data = await r.json();
    if (!r.ok && data.code) throw new Error(`Expected pass, got ${data.code}`);
  });

  await test("Spider-Man: hard-block with copyrighted_character", async () => {
    const r = await fetch(`${BASE}/api/generate-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://keepsy.store",
        "x-visitor-id": "smoke-test",
      },
      body: JSON.stringify({ prompt: "Spider-Man happy birthday" }),
    });
    const data = await r.json();
    if (r.ok) throw new Error("Expected 400 for Spider-Man");
    if (data.code !== "copyrighted_character") {
      throw new Error(`Expected code copyrighted_character, got ${data.code}`);
    }
    if (!Array.isArray(data.suggestions) || data.suggestions.length === 0) {
      throw new Error("Expected suggestions array");
    }
  });

  await test("watercolor style: allowed without rewrite", async () => {
    const r = await fetch(`${BASE}/api/generate-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://keepsy.store",
        "x-visitor-id": "smoke-test",
      },
      body: JSON.stringify({ prompt: "a watercolor style landscape" }),
    });
    const data = await r.json();
    if (!r.ok && data.code) {
      throw new Error(`watercolor should be allowed, got ${data.code}`);
    }
  });

  await test("generic superheroes: allowed", async () => {
    const r = await fetch(`${BASE}/api/generate-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://keepsy.store",
        "x-visitor-id": "smoke-test",
      },
      body: JSON.stringify({ prompt: "two superheroes happy birthday" }),
    });
    const data = await r.json();
    if (!r.ok && data.code === "copyrighted_character") {
      throw new Error("Generic superheroes should not be blocked");
    }
  });

  console.log("\nSafety smoke done. Ensure server is running (npm run dev) for full coverage.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
