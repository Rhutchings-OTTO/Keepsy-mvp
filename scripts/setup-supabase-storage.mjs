#!/usr/bin/env node
/**
 * One-time, idempotent setup for the private image bucket used when Cloudinary
 * is not configured. Creates the bucket if missing; never makes it public.
 *
 * Usage (reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local):
 *   node scripts/setup-supabase-storage.mjs
 *   SUPABASE_STORAGE_BUCKET=my-bucket node scripts/setup-supabase-storage.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const i = line.indexOf("=");
    if (i <= 0 || line.startsWith("#")) continue;
    const key = line.slice(0, i).trim();
    if (!process.env[key]) process.env[key] = line.slice(i + 1).trim().replace(/^"|"$/g, "");
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "keepsy-images";
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
if (listErr) {
  console.error("Could not list buckets:", listErr.message);
  process.exit(1);
}
const existing = (buckets ?? []).find((b) => b.name === bucket);
if (existing) {
  if (existing.public) {
    console.error(`Bucket "${bucket}" exists but is PUBLIC. Customer photos must stay private — make it private in the dashboard.`);
    process.exit(2);
  }
  console.log(`Bucket "${bucket}" already exists (private). Nothing to do.`);
  process.exit(0);
}
const { error } = await supabase.storage.createBucket(bucket, {
  public: false,
  fileSizeLimit: 26 * 1024 * 1024,
  allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
});
if (error) {
  console.error("Could not create bucket:", error.message);
  process.exit(1);
}
console.log(`Created PRIVATE bucket "${bucket}" (max 26 MB, png/jpeg/webp).`);
