/**
 * Durable hosting for generated designs and crops.
 *
 * Provider order: Cloudinary (when CLOUDINARY_* is set) → Supabase Storage
 * (private bucket, signed URL) → explicit failure. OpenAI URLs expire after
 * ~1 hour, so a permanent copy is required for checkout/fulfilment.
 *
 * All logic server-side only. Never expose CLOUDINARY_API_SECRET or the
 * service-role key to the client.
 */
import { isSupabaseStorageConfigured, uploadToStorage } from "@/lib/storage/supabaseStorage";

export type UploadResult = { ok: true; url: string; provider: "cloudinary" | "supabase" } | { ok: false; error: string };

export type ImageHostingProvider = "cloudinary" | "supabase" | null;

export function isCloudinaryConfigured(): boolean {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

/** Which durable image host is active, or null when neither is configured. */
export function getImageHostingProvider(): ImageHostingProvider {
  if (isCloudinaryConfigured()) return "cloudinary";
  if (isSupabaseStorageConfigured()) return "supabase";
  return null;
}

function parseDataUrl(imageDataUrl: string): { mime: "image/png" | "image/jpeg"; buffer: Buffer } | null {
  const match = imageDataUrl.match(/^data:(image\/(?:png|jpeg));base64,(.+)$/);
  if (!match) return null;
  return { mime: match[1] as "image/png" | "image/jpeg", buffer: Buffer.from(match[2], "base64") };
}

async function uploadToCloudinary(imageDataUrl: string, folder: string): Promise<UploadResult> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const UPLOAD_TIMEOUT_MS = 30_000;
  try {
    const { v2: cloudinary } = await import("cloudinary");
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    const uploadPromise = cloudinary.uploader.upload(imageDataUrl, { folder, resource_type: "image", overwrite: false });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Cloudinary upload timed out after 30s")), UPLOAD_TIMEOUT_MS)
    );
    const result = await Promise.race([uploadPromise, timeoutPromise]);
    const url = result?.secure_url;
    if (!url || typeof url !== "string") {
      console.error("[cloudinary] Upload succeeded but no secure_url returned.");
      return { ok: false, error: "Upload succeeded but no URL returned." };
    }
    // Add immutable cache flag for CDN (public, max-age=31536000, immutable)
    return { ok: true, url: url.replace("/upload/v", "/upload/fl_immutable_cache/v"), provider: "cloudinary" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    console.error("[cloudinary] Upload failed:", msg);
    return { ok: false, error: msg };
  }
}

async function uploadToSupabase(imageDataUrl: string, folder: string): Promise<UploadResult> {
  const parsed = parseDataUrl(imageDataUrl);
  if (!parsed) return { ok: false, error: "Invalid image data format." };
  try {
    const ext = parsed.mime === "image/png" ? "png" : "jpg";
    const path = `${folder}/${globalThis.crypto.randomUUID()}.${ext}`;
    const { url } = await uploadToStorage({ path, body: parsed.buffer, contentType: parsed.mime });
    return { ok: true, url, provider: "supabase" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    console.error("[supabase-storage] Upload failed:", msg);
    return { ok: false, error: msg };
  }
}

/**
 * Store an image (PNG/JPEG data URL) durably. `folder` groups objects
 * ("keepsy-designs" for AI output, "keepsy-crops" for canvas crops).
 */
export async function storeImage(imageDataUrl: string, folder = "keepsy-designs"): Promise<UploadResult> {
  if (!/^data:image\/(?:png|jpeg);base64,/.test(imageDataUrl)) {
    return { ok: false, error: "Invalid image data format." };
  }
  const provider = getImageHostingProvider();
  if (provider === "cloudinary") {
    const result = await uploadToCloudinary(imageDataUrl, folder);
    if (result.ok || !isSupabaseStorageConfigured()) return result;
    console.warn("[uploadImage] Cloudinary failed, falling back to Supabase Storage:", result.error);
    return uploadToSupabase(imageDataUrl, folder);
  }
  if (provider === "supabase") return uploadToSupabase(imageDataUrl, folder);
  console.error(
    "[uploadImage] No image host configured — set CLOUDINARY_* or NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY " +
      "(+ a private bucket, see scripts/setup-supabase-storage.mjs). Fulfilment will be skipped for this design."
  );
  return { ok: false, error: "Image hosting not configured." };
}

/** Backwards-compatible name used by existing callers. */
export async function uploadImageToCloudinary(imageDataUrl: string): Promise<UploadResult> {
  return storeImage(imageDataUrl, "keepsy-designs");
}
