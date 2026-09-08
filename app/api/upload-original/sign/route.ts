/**
 * POST /api/upload-original/sign
 *
 * Returns a short-lived upload target so the browser can upload the
 * customer's ORIGINAL photo directly to durable storage (no AI, no
 * re-encoding, no serverless body limit).
 *
 *   provider "cloudinary" → signed POST to api.cloudinary.com (secret stays server-side)
 *   provider "supabase"   → one-time signed PUT into the PRIVATE Storage bucket
 *
 * 503 with a clear message when neither host is configured.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { v2 as cloudinary } from "cloudinary";
import { guardOrigin, guardRateLimit, getRequestId } from "@/lib/security/withSecurity";
import { parseAndValidate } from "@/lib/http/validate";
import { MAX_ORIGINAL_BYTES, ORIGINAL_UPLOAD_FOLDER, validateOriginalFile } from "@/lib/uploads/originalPhoto";
import { getImageHostingProvider } from "@/lib/uploadImage";
import { createSignedUploadTarget } from "@/lib/storage/supabaseStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z
  .object({
    mime: z.string().max(64),
    bytes: z.number().int().positive().max(MAX_ORIGINAL_BYTES),
    fileName: z.string().max(200).optional(),
  })
  .strict();

const EXT_FOR_MIME: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const originDeny = guardOrigin(req, "/api/upload-original/sign", requestId);
  if (originDeny) return originDeny;
  const rl = await guardRateLimit(req, "/api/upload-original/sign", "POST", requestId);
  if ("response" in rl) return rl.response;

  const provider = getImageHostingProvider();
  if (!provider) {
    return NextResponse.json(
      { error: "IMAGE_HOSTING_NOT_CONFIGURED", message: "Photo uploads aren't switched on yet. Please try again later." },
      { status: 503, headers: rl.headers }
    );
  }

  const parsed = await parseAndValidate(req, schema, 8 * 1024);
  if ("error" in parsed) return NextResponse.json(parsed.error, { status: parsed.status, headers: rl.headers });

  const validation = validateOriginalFile({ type: parsed.data.mime, size: parsed.data.bytes, name: parsed.data.fileName });
  if (!validation.ok) {
    return NextResponse.json({ error: "INVALID_FILE", message: validation.message }, { status: 400, headers: rl.headers });
  }

  const id = globalThis.crypto.randomUUID();

  if (provider === "cloudinary") {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
    const apiKey = process.env.CLOUDINARY_API_KEY!;
    const apiSecret = process.env.CLOUDINARY_API_SECRET!;
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = `${ORIGINAL_UPLOAD_FOLDER}/${id}`;
    // Only these parameters are signed; Cloudinary rejects any others the client might add.
    const paramsToSign: Record<string, string | number> = { public_id: publicId, timestamp, overwrite: "false" };
    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);
    return NextResponse.json(
      {
        provider: "cloudinary",
        method: "POST",
        uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        fields: { api_key: apiKey, timestamp, signature, public_id: publicId, overwrite: "false" },
        headers: {},
        publicId,
        maxBytes: MAX_ORIGINAL_BYTES,
      },
      { headers: rl.headers }
    );
  }

  // Supabase Storage: one-time signed PUT into the private bucket.
  const path = `${ORIGINAL_UPLOAD_FOLDER}/${id}.${EXT_FOR_MIME[validation.mime]}`;
  try {
    const target = await createSignedUploadTarget(path);
    return NextResponse.json(
      {
        provider: "supabase",
        method: "PUT",
        uploadUrl: target.url,
        fields: {},
        headers: { "content-type": validation.mime, "x-upsert": "false" },
        publicId: path,
        maxBytes: MAX_ORIGINAL_BYTES,
      },
      { headers: rl.headers }
    );
  } catch (e) {
    console.error("[upload-original/sign] storage error:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "IMAGE_HOSTING_UNAVAILABLE", message: "Photo uploads aren't available right now. Please try again shortly." },
      { status: 503, headers: rl.headers }
    );
  }
}
