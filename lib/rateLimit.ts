import { Ratelimit } from "@upstash/ratelimit";
import { logger } from "./logger";
import { Redis } from "@upstash/redis";
import crypto from "crypto";

/**
 * Rate limiter for anonymous submissions.
 *
 * Privacy note
 * ------------
 * We NEVER store or send raw IP addresses to Upstash or logs. Every incoming
 * IP is HMAC-SHA256'd with a server-side secret before being used as a
 * bucket key. Two important consequences:
 *
 *  1. Upstash Redis only ever sees an opaque 32-char token. If Upstash or
 *     our Redis DB is compromised, no reporter can be traced back.
 *  2. We rotate the secret to invalidate all existing rate-limit buckets
 *     without leaking any historical mapping.
 *
 * This works because we only need equality (same visitor within a window),
 * not the raw IP. Hashing preserves that property.
 */

// Create a new ratelimiter that allows 5 requests per 60 seconds per IP-hash.
// Falls back to no rate limiting if UPSTASH_REDIS_REST_URL is not set.
let ratelimit: Ratelimit | null = null;

// Salt derived from env — treated as a secret. Rotating it purges buckets.
const IP_HASH_SECRET =
  process.env.NIRBHOY_IP_HASH_SECRET ||
  process.env.NIRBHOY_SESSION_COOKIE || // fallback so dev still works
  "nirbhoy-default-ip-salt-CHANGE-ME";

function getRatelimiter() {
  if (ratelimit) return ratelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    logger.warn("UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting disabled");
    return null;
  }

  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    analytics: true,
    prefix: "nirbhoy",
  });

  return ratelimit;
}

/**
 * Deterministically hash a raw IP so we never store it. Truncated to 24
 * chars — plenty of entropy for a rate-limit bucket key, short enough to
 * keep Redis writes cheap.
 */
function hashIp(rawIp: string): string {
  return crypto
    .createHmac("sha256", IP_HASH_SECRET)
    .update(rawIp)
    .digest("hex")
    .slice(0, 24);
}

/**
 * Extract the caller's IP from the request. Returns the raw IP so it can
 * be hashed immediately; the raw value is NEVER logged or persisted.
 */
function extractRawIp(req: any): string {
  const fwd = req.headers?.["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) {
    return fwd.split(",")[0]!.trim();
  }
  if (typeof req.headers?.["x-real-ip"] === "string") {
    return req.headers["x-real-ip"];
  }
  return req.socket?.remoteAddress || "unknown";
}

/**
 * Rate limit middleware for API routes.
 * Usage: const { success, limit, remaining } = await checkRateLimit(req);
 * If !success, return 429.
 */
export async function checkRateLimit(req: any) {
  const limiter = getRatelimiter();
  if (!limiter) return { success: true, limit: Infinity, remaining: Infinity };

  const rawIp = extractRawIp(req);
  // Immediately convert to an opaque hash before anything else touches it.
  const bucketKey = "ip:" + hashIp(rawIp);

  const { success, limit, remaining } = await limiter.limit(bucketKey);
  return { success, limit, remaining };
}

/**
 * Higher-order function to wrap API handlers with rate limiting.
 */
export function withRateLimit(handler: any, _options: any = {}) {
  return async (req: any, res: any) => {
    const { success, limit, remaining } = await checkRateLimit(req);

    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", remaining);

    if (!success) {
      return res.status(429).json({
        error: "অনেক বেশি রিকোয়েস্ট। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।",
      });
    }

    return handler(req, res);
  };
}
