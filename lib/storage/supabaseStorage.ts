/**
 * Supabase Storage (server-only, service role) — durable image hosting used
 * when Cloudinary is not configured. The bucket is PRIVATE: browsers only ever
 * see short-lived signed URLs, and print fulfilment downloads objects with the
 * service role rather than relying on a URL that may have expired.
 *
 * Setup (additive, see scripts/setup-supabase-storage.mjs):
 *   - create a private bucket named $SUPABASE_STORAGE_BUCKET (default "keepsy-images")
 *   - no public access, no RLS policies needed (service role only)
 */
import { isSupabaseStorageImageUrl } from "./allowedImageHosts";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const DEFAULT_STORAGE_BUCKET = "keepsy-images";
/** Signed URLs for previews/print sources. Fulfilment re-downloads with the service role regardless. */
export const SIGNED_URL_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export type StorageRef = { bucket: string; path: string };

export function getStorageBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_STORAGE_BUCKET;
}

export function getSupabaseHost(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/** True when uploads can go to Supabase Storage (URL + service role key present). */
export function isSupabaseStorageConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Parse a Supabase Storage object URL (signed, public or authenticated form)
 * on OUR project host. Returns null for anything else.
 */
export function parseStorageUrl(url: string): StorageRef | null {
  const host = getSupabaseHost();
  if (!host || !isSupabaseStorageImageUrl(url)) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" || u.hostname !== host) return null;
    const m = u.pathname.match(/^\/storage\/v1\/object\/(?:sign|public|authenticated)\/([^/]+)\/(.+)$/);
    if (!m) return null;
    return { bucket: decodeURIComponent(m[1]), path: decodeURIComponent(m[2]) };
  } catch {
    return null;
  }
}

export function isStorageUrl(url: string): boolean {
  return parseStorageUrl(url) !== null;
}

export async function createSignedUrl(ref: StorageRef, expiresIn = SIGNED_URL_TTL_SECONDS): Promise<string> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase Storage is not configured.");
  const { data, error } = await supabase.storage.from(ref.bucket).createSignedUrl(ref.path, expiresIn);
  if (error || !data?.signedUrl) throw new Error(`Could not sign storage URL: ${error?.message ?? "unknown"}`);
  return data.signedUrl;
}

/** Upload bytes to the private bucket and return a signed URL for them. */
export async function uploadToStorage(args: {
  path: string;
  body: Buffer;
  contentType: string;
}): Promise<{ url: string; ref: StorageRef }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase Storage is not configured.");
  const bucket = getStorageBucket();
  const { error } = await supabase.storage.from(bucket).upload(args.path, args.body, {
    contentType: args.contentType,
    upsert: false,
    cacheControl: "31536000",
  });
  if (error) {
    const msg = /bucket not found/i.test(error.message)
      ? `Storage bucket "${bucket}" does not exist. Run scripts/setup-supabase-storage.mjs (creates a PRIVATE bucket).`
      : error.message;
    throw new Error(msg);
  }
  const ref = { bucket, path: args.path };
  return { url: await createSignedUrl(ref), ref };
}

/** One-time signed upload target for a direct browser → Storage PUT (bypasses function body limits). */
export async function createSignedUploadTarget(path: string): Promise<{ url: string; token: string; ref: StorageRef }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase Storage is not configured.");
  const bucket = getStorageBucket();
  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) {
    const msg = error && /bucket not found/i.test(error.message)
      ? `Storage bucket "${bucket}" does not exist. Run scripts/setup-supabase-storage.mjs (creates a PRIVATE bucket).`
      : error?.message ?? "unknown";
    throw new Error(`Could not create upload URL: ${msg}`);
  }
  return { url: data.signedUrl, token: data.token, ref: { bucket, path } };
}

export async function downloadFromStorage(ref: StorageRef): Promise<Buffer> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase Storage is not configured.");
  const { data, error } = await supabase.storage.from(ref.bucket).download(ref.path);
  if (error || !data) throw new Error(`Could not download ${ref.bucket}/${ref.path}: ${error?.message ?? "unknown"}`);
  return Buffer.from(await data.arrayBuffer());
}

/**
 * Re-sign a possibly-expired signed URL so it can be displayed again (account
 * page, success page). Non-storage URLs are returned unchanged.
 */
export async function refreshSignedUrl(url: string | null | undefined, expiresIn = 60 * 60): Promise<string | null> {
  if (!url) return null;
  const ref = parseStorageUrl(url);
  if (!ref) return url;
  try {
    return await createSignedUrl(ref, expiresIn);
  } catch {
    return url;
  }
}
