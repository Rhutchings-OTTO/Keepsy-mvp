/**
 * Upload generated images to permanent storage (Cloudinary).
 * OpenAI URLs expire after ~1 hour; we persist to Cloudinary for checkout/fulfillment.
 * All logic server-side only. Never expose CLOUDINARY_API_SECRET to client.
 */

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

export async function uploadImageToCloudinary(
  imageDataUrl: string
): Promise<UploadResult> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return { ok: false, error: "Image hosting not configured." };
  }

  const match = imageDataUrl.match(/^data:(image\/(?:png|jpeg));base64,(.+)$/);
  if (!match) {
    return { ok: false, error: "Invalid image data format." };
  }

  try {
    const { v2: cloudinary } = await import("cloudinary");
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const result = await cloudinary.uploader.upload(imageDataUrl, {
      folder: "keepsy-designs",
      resource_type: "image",
      overwrite: false,
    });

    const url = result?.secure_url;
    if (!url || typeof url !== "string") {
      return { ok: false, error: "Upload succeeded but no URL returned." };
    }
    return { ok: true, url };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return { ok: false, error: msg };
  }
}
