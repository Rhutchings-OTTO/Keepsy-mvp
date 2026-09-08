/**
 * Resolve the source image for an AI edit into a PNG/JPEG data URL.
 *
 * Accepts either a data URL (fresh upload) or an https URL on our own
 * Cloudinary cloud (a persisted history node). WebP is converted to PNG with
 * sharp because the OpenAI edits endpoint only takes PNG/JPEG. Server-only.
 */
import sharp from "sharp";
import { isAllowedImageSourceUrl } from "@/lib/storage/allowedImageHosts";
import { downloadFromStorage, parseStorageUrl } from "@/lib/storage/supabaseStorage";

const MAX_REMOTE_BYTES = 25 * 1024 * 1024;

/** Only images we host (our Cloudinary cloud or our Supabase Storage). */
export function isAllowedSourceUrl(url: string): boolean {
  return isAllowedImageSourceUrl(url);
}

async function toPngOrJpegDataUrl(buffer: Buffer, mime: string): Promise<string> {
  if (mime === "image/png" || mime === "image/jpeg") {
    return `data:${mime};base64,${buffer.toString("base64")}`;
  }
  // WebP (and anything else sharp can read) → PNG. Also normalises EXIF rotation.
  const png = await sharp(buffer).rotate().png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

export async function resolveSourceImage(args: {
  dataUrl?: string | null;
  url?: string | null;
}): Promise<{ ok: true; dataUrl: string } | { ok: false; error: string }> {
  if (args.dataUrl) {
    const match = args.dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
    if (!match) return { ok: false, error: "Invalid uploaded image format. Please use JPG, PNG or WebP." };
    const [, mime, b64] = match;
    if (mime === "image/png" || mime === "image/jpeg") return { ok: true, dataUrl: args.dataUrl };
    try {
      return { ok: true, dataUrl: await toPngOrJpegDataUrl(Buffer.from(b64, "base64"), mime) };
    } catch {
      return { ok: false, error: "We couldn't read that image. Please try a JPG or PNG." };
    }
  }

  if (args.url) {
    if (!isAllowedSourceUrl(args.url)) return { ok: false, error: "Source image must be a Keepsy-hosted image." };
    const storageRef = parseStorageUrl(args.url);
    if (storageRef) {
      try {
        const buf = await downloadFromStorage(storageRef);
        if (buf.length > MAX_REMOTE_BYTES) return { ok: false, error: "Source image is too large." };
        const meta = await sharp(buf).metadata();
        return { ok: true, dataUrl: await toPngOrJpegDataUrl(buf, meta.format === "jpeg" ? "image/jpeg" : meta.format === "png" ? "image/png" : "image/webp") };
      } catch {
        return { ok: false, error: "Could not read the source image." };
      }
    }
    try {
      const res = await fetch(args.url, { signal: AbortSignal.timeout(20_000), redirect: "error" });
      if (!res.ok) return { ok: false, error: `Could not fetch the source image (${res.status}).` };
      const len = Number(res.headers.get("content-length") ?? 0);
      if (len > MAX_REMOTE_BYTES) return { ok: false, error: "Source image is too large." };
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > MAX_REMOTE_BYTES) return { ok: false, error: "Source image is too large." };
      const mime = (res.headers.get("content-type") ?? "").split(";")[0].trim() || "image/png";
      return { ok: true, dataUrl: await toPngOrJpegDataUrl(buf, mime) };
    } catch {
      return { ok: false, error: "Could not fetch the source image." };
    }
  }

  return { ok: false, error: "No source image provided." };
}
