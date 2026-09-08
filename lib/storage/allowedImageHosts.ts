/**
 * Which https URLs may be used as print sources / AI edit sources.
 *
 * Only images WE hosted qualify: our Cloudinary cloud (when configured) or our
 * Supabase Storage project. This closes the SSRF surface where a buyer could
 * point `designUrl` at an internal host and have the webhook fetch it.
 *
 * Pure host/path checks — safe to import anywhere (no secrets read beyond
 * public config), but the Cloudinary cloud name is server-only, so on the
 * client this degrades to "any res.cloudinary.com delivery URL".
 */

function cloudinaryCloud(): string | null {
  return process.env.CLOUDINARY_CLOUD_NAME || null;
}

function supabaseHost(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function isCloudinaryImageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" || u.hostname !== "res.cloudinary.com") return false;
    const cloud = cloudinaryCloud();
    const prefix = cloud ? `/${cloud}/image/upload/` : "/";
    return u.pathname.startsWith(prefix) && (cloud ? true : /^\/[^/]+\/image\/upload\//.test(u.pathname));
  } catch {
    return false;
  }
}

export function isSupabaseStorageImageUrl(url: string): boolean {
  const host = supabaseHost();
  if (!host) return false;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" || u.hostname !== host || u.port) return false;
    const match = u.pathname.match(/^\/storage\/v1\/object\/(?:sign|public|authenticated)\/([^/]+)\/(.+)$/);
    return Boolean(match && decodeURIComponent(match[1]) === (process.env.SUPABASE_STORAGE_BUCKET || "keepsy-images") && /^keepsy-(?:designs|originals|crops)\/[a-zA-Z0-9-]+\.(?:png|jpe?g|webp)$/.test(decodeURIComponent(match[2])));
  } catch {
    return false;
  }
}

/** Keepsy-hosted image URL (Cloudinary or Supabase Storage) — the only kind we will fetch server-side. */
export function isAllowedImageSourceUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return isCloudinaryImageUrl(url) || isSupabaseStorageImageUrl(url);
}
