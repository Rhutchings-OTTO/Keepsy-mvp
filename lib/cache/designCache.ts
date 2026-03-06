/**
 * Design cache invalidation hook.
 * Generation cache is in-memory with 3min TTL; this is a placeholder for
 * future Redis-based cache or Cloudinary purge if needed.
 */
export async function clearDesignCacheForOrder(designUrl: string | null): Promise<void> {
  if (!designUrl) return;
  if (process.env.NODE_ENV !== "production") {
    console.log("[cache] Design cache clear requested for:", designUrl.slice(0, 60) + "...");
  }
  // Future: invalidate Redis keys, call Cloudinary purge, etc.
}
