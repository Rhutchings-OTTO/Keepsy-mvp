/**
 * Safe server-side retrieval of a print source image.
 *
 * - Only Keepsy-hosted URLs (our Cloudinary cloud / our Supabase Storage).
 * - Supabase objects are downloaded with the service role, so an expired
 *   signed URL never blocks fulfilment.
 * - Remote fetches have a timeout, no redirects, and a byte cap.
 * - Output is always PNG or JPEG bytes (WebP is converted) so Printify and the
 *   compositors get a format they accept.
 */
import sharp from "sharp";
import { isAllowedImageSourceUrl } from "@/lib/storage/allowedImageHosts";
import { downloadFromStorage, parseStorageUrl } from "@/lib/storage/supabaseStorage";

const MAX_PRINT_SOURCE_BYTES = 40 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 20_000;

export async function fetchPrintSourceBuffer(url: string): Promise<Buffer> {
  if (!isAllowedImageSourceUrl(url)) {
    throw new Error("Print source must be a Keepsy-hosted image URL.");
  }
  const storageRef = parseStorageUrl(url);
  let raw: Buffer;
  if (storageRef) {
    raw = await downloadFromStorage(storageRef);
  } else {
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), redirect: "error" });
    if (!res.ok) throw new Error(`Failed to fetch print source (${res.status})`);
    const declared = Number(res.headers.get("content-length") ?? 0);
    if (declared > MAX_PRINT_SOURCE_BYTES) throw new Error("Print source is too large.");
    raw = Buffer.from(await res.arrayBuffer());
  }
  if (raw.length > MAX_PRINT_SOURCE_BYTES) throw new Error("Print source is too large.");
  return ensurePrintableFormat(raw);
}

/** PNG/JPEG pass through untouched; anything else (WebP, HEIC…) becomes PNG with EXIF rotation applied. */
export async function ensurePrintableFormat(buffer: Buffer): Promise<Buffer> {
  const meta = await sharp(buffer).metadata();
  if (meta.format === "png" || meta.format === "jpeg") return buffer;
  return sharp(buffer).rotate().png().toBuffer();
}
