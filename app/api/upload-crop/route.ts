/**
 * Upload a client-side cropped canvas image to Cloudinary.
 * Called from CanvasCropTool after the user confirms their crop.
 */
import { uploadImageToCloudinary } from "@/lib/uploadImage";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const JSON_HEADERS = { "Content-Type": "application/json" };

  let body: { imageDataUrl?: string };
  try {
    body = await req.json() as { imageDataUrl?: string };
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: JSON_HEADERS });
  }

  const { imageDataUrl } = body;
  if (!imageDataUrl || typeof imageDataUrl !== "string" || !imageDataUrl.startsWith("data:image/")) {
    return new Response(JSON.stringify({ error: "Missing or invalid imageDataUrl" }), { status: 400, headers: JSON_HEADERS });
  }

  // Sanity-check size (~5MB base64 ≈ 6.67MB decoded — reject huge payloads)
  if (imageDataUrl.length > 8 * 1024 * 1024) {
    return new Response(JSON.stringify({ error: "Image too large (max ~5MB)" }), { status: 413, headers: JSON_HEADERS });
  }

  const result = await uploadImageToCloudinary(imageDataUrl);
  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error }), { status: 500, headers: JSON_HEADERS });
  }

  return new Response(JSON.stringify({ url: result.url }), { status: 200, headers: JSON_HEADERS });
}
