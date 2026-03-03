#!/usr/bin/env node
/**
 * Safety pipeline smoke tests.
 * Verifies patch-based rewrite, intent preservation, and hard-block behavior.
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

function hasAll(str, words) {
  const lower = (str || "").toLowerCase();
  return words.every((w) => lower.includes(w.toLowerCase()));
}

async function main() {
  console.log("Safety smoke tests against", BASE);

  await test("puppy top hat gatsby: returns ok or soft_warning with intent preserved", async () => {
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
    if (r.ok && data.ok) {
      const prompt = data.patchedPrompt || data.promptUsed || "";
      if (!hasAll(prompt, ["puppy", "top hat", "congratulations", "cartoon"])) {
        throw new Error(`Patched prompt missing intent: ${prompt.slice(0, 150)}...`);
      }
      if (!hasAll(prompt, ["1920s"]) && !hasAll(prompt, ["art-deco"]) && !hasAll(prompt, ["vibe"])) {
        throw new Error(`Expected 1920s/vibe replacement: ${prompt.slice(0, 150)}...`);
      }
      if (data.appliedPatches && data.appliedPatches.length > 0) {
        return;
      }
    }
    if (!r.ok && data.code === "soft_warning" && data.suggestedPrompt) {
      const suggested = data.suggestedPrompt;
      if (!hasAll(suggested, ["puppy", "top hat", "congratulations", "cartoon"])) {
        throw new Error(`Suggested prompt missing intent: ${suggested.slice(0, 150)}...`);
      }
      if (data.appliedPatches && data.appliedPatches.length > 0) {
        return;
      }
    }
    if (r.ok && data.ok) return;
    if (!r.ok && data.code === "soft_warning") return;
    throw new Error(`Unexpected response: ok=${data.ok}, code=${data.code}`);
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

  await test("in the style of Disney: hard-block", async () => {
    const r = await fetch(`${BASE}/api/generate-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://keepsy.store",
        "x-visitor-id": "smoke-test",
      },
      body: JSON.stringify({ prompt: "a cute dog in the style of Disney" }),
    });
    const data = await r.json();
    if (r.ok) throw new Error("Expected 400 for Disney style");
    if (data.code !== "style_of_brand") {
      throw new Error(`Expected code style_of_brand, got ${data.code}`);
    }
  });

  await test("generic superheroes: allowed or minimal rewrite", async () => {
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
