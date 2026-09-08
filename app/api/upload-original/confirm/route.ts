/**
 * POST /api/upload-original/confirm
 *
 * After the browser has uploaded the original photo, verify the asset really
 * exists in OUR storage and return trustworthy dimensions/format/bytes read
 * server-side (Cloudinary Admin API, or sharp over the private Storage
 * object) — never from the client. Also returns the print-quality rating for
 * an optional product.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import { guardOrigin, guardRateLimit, getRequestId } from "@/lib/security/withSecurity";
import { parseAndValidate } from "@/lib/http/validate";
import { isOriginalPublicId, MIN_ORIGINAL_EDGE_PX } from "@/lib/uploads/originalPhoto";
import { assessPrintQuality } from "@/lib/print/quality";
import { getImageHostingProvider } from "@/lib/uploadImage";
import { createSignedUrl, downloadFromStorage, getStorageBucket } from "@/lib/storage/supabaseStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z
  .object({
    publicId: z.string().max(200),
    productId: z.string().max(64).optional(),
    size: z.string().max(16).optional(),
  })
  .strict();

type CloudinaryResource = {
  secure_url: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
  public_id: string;
};

type Verified = { url: string; previewUrl: string; width: number; height: number; bytes: number; format: string };

async function verifyCloudinary(publicId: string): Promise<Verified | { notFound: true }> {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  let resource: CloudinaryResource;
  try {
    resource = (await cloudinary.api.resource(publicId, { resource_type: "image" })) as CloudinaryResource;
  } catch {
    return { notFound: true };
  }
  const fmt = (resource.format || "").toLowerCase();
  // Print sources must be PNG/JPEG for Printify; WebP originals are delivered as PNG (lossless conversion).
  const printUrl = fmt === "png" || fmt === "jpg" || fmt === "jpeg" ? resource.secure_url : resource.secure_url.replace("/image/upload/", "/image/upload/f_png/");
  return {
    url: printUrl.replace("/upload/v", "/upload/fl_immutable_cache/v"),
    previewUrl: resource.secure_url,
    width: resource.width,
    height: resource.height,
    bytes: resource.bytes,
    format: fmt,
  };
}

async function verifySupabase(path: string): Promise<Verified | { notFound: true }> {
  const ref = { bucket: getStorageBucket(), path };
  let buf: Buffer;
  try {
    buf = await downloadFromStorage(ref);
  } catch {
    return { notFound: true };
  }
  const meta = await sharp(buf).metadata();
  // Honour EXIF orientation so portrait phone photos report portrait dimensions.
  const rotated = meta.orientation && meta.orientation >= 5;
  const width = (rotated ? meta.height : meta.width) ?? 0;
  const height = (rotated ? meta.width : meta.height) ?? 0;
  const url = await createSignedUrl(ref);
  return { url, previewUrl: url, width, height, bytes: buf.length, format: (meta.format ?? "").toLowerCase() };
}

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const originDeny = guardOrigin(req, "/api/upload-original/confirm", requestId);
  if (originDeny) return originDeny;
  const rl = await guardRateLimit(req, "/api/upload-original/confirm", "POST", requestId);
  if ("response" in rl) return rl.response;

  const provider = getImageHostingProvider();
  if (!provider) {
    return NextResponse.json(
      { error: "IMAGE_HOSTING_NOT_CONFIGURED", message: "Photo uploads aren't switched on yet." },
      { status: 503, headers: rl.headers }
    );
  }

  const parsed = await parseAndValidate(req, schema, 8 * 1024);
  if ("error" in parsed) return NextResponse.json(parsed.error, { status: parsed.status, headers: rl.headers });
  const { publicId, productId, size } = parsed.data;
  if (!isOriginalPublicId(publicId)) {
    return NextResponse.json({ error: "INVALID_ASSET", message: "That upload could not be verified." }, { status: 400, headers: rl.headers });
  }

  // Ids with an extension belong to Storage objects; bare ids are Cloudinary public ids.
  const isStoragePath = /\.(?:jpg|jpeg|png|webp)$/.test(publicId);
  let verified: Verified | { notFound: true };
  try {
    verified = isStoragePath ? await verifySupabase(publicId) : await verifyCloudinary(publicId);
  } catch (e) {
    console.error("[upload-original/confirm] verification error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "INVALID_IMAGE", message: "That file doesn't look like an image." }, { status: 400, headers: rl.headers });
  }
  if ("notFound" in verified) {
    return NextResponse.json({ error: "ASSET_NOT_FOUND", message: "We couldn't find that upload. Please try again." }, { status: 404, headers: rl.headers });
  }

  const { width, height } = verified;
  if (!(width > 0) || !(height > 0)) {
    return NextResponse.json({ error: "INVALID_IMAGE", message: "That file doesn't look like an image." }, { status: 400, headers: rl.headers });
  }
  if (Math.max(width, height) < MIN_ORIGINAL_EDGE_PX) {
    return NextResponse.json(
      {
        error: "TOO_SMALL",
        message: `This photo is only ${width}×${height}px — too small to print clearly. Please use a photo at least ${MIN_ORIGINAL_EDGE_PX}px on its longest side.`,
        width,
        height,
      },
      { status: 400, headers: rl.headers }
    );
  }

  const quality = productId ? assessPrintQuality({ productId, size, imageWidth: width, imageHeight: height }) : null;
  return NextResponse.json({ ...verified, quality, provider }, { headers: rl.headers });
}
