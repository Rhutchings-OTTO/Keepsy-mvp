/**
 * Original-photo upload rules shared by the client and the API routes.
 *
 * The customer's untouched photo is uploaded straight from the browser to
 * Cloudinary (signed by /api/upload-original/sign) so full-resolution files up
 * to 25 MB never pass through a serverless function body limit. The server
 * then confirms the asset (/api/upload-original/confirm) and reports honest
 * pixel dimensions for print-quality feedback.
 */

export const ORIGINAL_UPLOAD_FOLDER = "keepsy-originals";
export const MAX_ORIGINAL_BYTES = 25 * 1024 * 1024;
export const MIN_ORIGINAL_EDGE_PX = 600;

/** MIME types we accept as print sources. HEIC is rejected with guidance (browsers/Printify can't use it). */
export const ACCEPTED_ORIGINAL_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export type AcceptedOriginalMime = (typeof ACCEPTED_ORIGINAL_MIME)[number];

export type OriginalUploadValidation =
  | { ok: true; mime: AcceptedOriginalMime }
  | { ok: false; message: string };

export function validateOriginalFile(file: { type: string; size: number; name?: string }): OriginalUploadValidation {
  const type = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  if (type === "image/heic" || type === "image/heif" || name.endsWith(".heic") || name.endsWith(".heif")) {
    return {
      ok: false,
      message: "HEIC photos can't be printed directly. On iPhone, share the photo as JPEG (Settings → Camera → Formats → Most Compatible) or export it as JPG/PNG first.",
    };
  }
  if (!(ACCEPTED_ORIGINAL_MIME as readonly string[]).includes(type)) {
    return { ok: false, message: "Please upload a JPG, PNG or WebP photo." };
  }
  if (file.size <= 0) return { ok: false, message: "That file looks empty. Please choose another photo." };
  if (file.size > MAX_ORIGINAL_BYTES) {
    return { ok: false, message: "This photo is larger than 25 MB. Please choose a smaller export of it." };
  }
  return { ok: true, mime: type as AcceptedOriginalMime };
}

/**
 * Upload id check (defends the confirm endpoint against arbitrary ids).
 *   Cloudinary: keepsy-originals/<uuid>
 *   Supabase:   keepsy-originals/<uuid>.<jpg|jpeg|png|webp>  (object path in the private bucket)
 */
export function isOriginalPublicId(publicId: string): boolean {
  return /^keepsy-originals\/[A-Za-z0-9_-]+(?:\.(?:jpg|jpeg|png|webp))?$/.test(publicId);
}

/** Only accept delivery URLs on our own cloud for print sources. */
export function isCloudinaryDeliveryUrl(url: string, cloudName: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === "res.cloudinary.com" && u.pathname.startsWith(`/${cloudName}/image/upload/`);
  } catch {
    return false;
  }
}
