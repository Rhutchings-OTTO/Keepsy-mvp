"use client";

/**
 * Browser side of the original-photo path: validate → get a signature from
 * our API → upload the untouched file straight to Cloudinary → ask our API to
 * confirm the asset and report honest dimensions/print quality.
 *
 * Never touches /api/generate-image.
 */
import { validateOriginalFile } from "./originalPhoto";
import type { PrintQuality } from "@/lib/print/quality";

export type OriginalUploadResult = {
  url: string;
  previewUrl: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
  quality: PrintQuality | null;
  publicId: string;
};

export class OriginalUploadError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function uploadOriginalPhoto(
  file: File,
  opts: { productId?: string; size?: string; onProgress?: (fraction: number) => void } = {}
): Promise<OriginalUploadResult> {
  const validation = validateOriginalFile(file);
  if (!validation.ok) throw new OriginalUploadError("INVALID_FILE", validation.message);

  // 1. Signature
  const signRes = await fetch("/api/upload-original/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mime: validation.mime, bytes: file.size, fileName: file.name }),
  });
  const sign = await readJson(signRes);
  if (!signRes.ok) {
    throw new OriginalUploadError(
      String(sign.error ?? "SIGN_FAILED"),
      String(sign.message ?? "We couldn't prepare the upload. Please try again.")
    );
  }
  const uploadUrl = String(sign.uploadUrl);
  const method = sign.method === "PUT" ? "PUT" : "POST";
  const fields = (sign.fields ?? {}) as Record<string, string | number>;
  const headers = (sign.headers ?? {}) as Record<string, string>;
  const publicId = String(sign.publicId);

  // 2. Direct upload (XHR so we can report progress).
  //    Cloudinary: multipart POST with the signed fields. Supabase Storage: raw PUT to the signed URL.
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, uploadUrl);
    xhr.timeout = 120_000;
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    let body: FormData | File;
    if (method === "POST") {
      const form = new FormData();
      Object.entries(fields).forEach(([k, v]) => form.append(k, String(v)));
      form.append("file", file);
      body = form;
    } else {
      body = file;
    }
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && opts.onProgress) opts.onProgress(Math.min(0.95, e.loaded / e.total));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new OriginalUploadError("UPLOAD_FAILED", "The upload didn't complete. Please check your connection and try again."));
    };
    xhr.onerror = () => reject(new OriginalUploadError("UPLOAD_FAILED", "The upload didn't complete. Please check your connection and try again."));
    xhr.ontimeout = () => reject(new OriginalUploadError("UPLOAD_TIMEOUT", "Your upload took too long. Please check your connection and try again."));
    xhr.send(body);
  });

  // 3. Confirm (server reads real dimensions from Cloudinary)
  const confirmRes = await fetch("/api/upload-original/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicId, productId: opts.productId, size: opts.size }),
  });
  const confirm = await readJson(confirmRes);
  if (!confirmRes.ok) {
    throw new OriginalUploadError(
      String(confirm.error ?? "CONFIRM_FAILED"),
      String(confirm.message ?? "We couldn't verify the upload. Please try again.")
    );
  }
  opts.onProgress?.(1);
  return {
    url: String(confirm.url),
    previewUrl: String(confirm.previewUrl ?? confirm.url),
    width: Number(confirm.width),
    height: Number(confirm.height),
    bytes: Number(confirm.bytes),
    format: String(confirm.format ?? ""),
    quality: (confirm.quality as PrintQuality | null) ?? null,
    publicId,
  };
}
