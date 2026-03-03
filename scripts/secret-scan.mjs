#!/usr/bin/env node
/**
 * Lightweight secret scanning. Run before commit.
 * Usage: npm run secret-scan
 */
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const PATTERNS = [
  [/sk_live_[a-zA-Z0-9]{24,}/, "Stripe live key"],
  [/sk_test_[a-zA-Z0-9]{24,}/, "Stripe test key"],
  [/sk-[a-zA-Z0-9]{20,}/, "OpenAI key"],
];

const IGNORE = ["node_modules", ".git", ".next", "dist"];

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory() && !IGNORE.includes(e.name)) walk(p, out);
    else if (/\.(js|ts|tsx|mjs|json|env)$/.test(e.name)) out.push(p);
  }
  return out;
}

let leak = false;
for (const f of walk(process.cwd())) {
  const txt = readFileSync(f, "utf8");
  for (const [re, name] of PATTERNS) {
    if (re.test(txt)) {
      console.error("LEAK:", f, "-", name);
      leak = true;
    }
  }
}
process.exit(leak ? 1 : 0);
