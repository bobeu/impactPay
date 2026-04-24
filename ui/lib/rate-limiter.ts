import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Global Rate Limiter for Sensitive API Routes
 * Prevents drainage attacks and spam.
 */
export const ratelimit = 
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds
        analytics: true,
        prefix: "@impactpay/ratelimit",
      })
    : null;

/**
 * Helper to check rate limit for a specific identifier (e.g. IP or Wallet)
 */
export async function checkRateLimit(identifier: string) {
  if (!ratelimit) {
    console.warn("⚠️ Rate limiting is disabled (Redis env vars missing).");
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }
  return await ratelimit.limit(identifier);
}
