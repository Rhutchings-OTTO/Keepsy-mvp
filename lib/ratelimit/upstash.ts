/**
 * Upstash Redis rate limiting for generation endpoints.
 * 5 generations every 10 minutes per IP (sliding window).
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  if (!ratelimit) {
    const redis = new Redis({ url, token });
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "10 m"),
    });
  }
  return ratelimit;
}

export async function checkAtelierCapacity(ip: string): Promise<{
  success: boolean;
  reset: number;
  remaining?: number;
}> {
  const rl = getRatelimit();
  if (!rl) return { success: true, reset: 0 };

  const result = await rl.limit(ip);
  return {
    success: result.success,
    reset: result.reset,
    remaining: result.remaining,
  };
}
