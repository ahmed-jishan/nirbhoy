import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new ratelimiter that allows 5 requests per 60 seconds per IP
// Falls back to no rate limiting if UPSTASH_REDIS_REST_URL is not set
let ratelimit = null;

function getRatelimiter() {
  if (ratelimit) return ratelimit;
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    console.warn("⚠️  UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting disabled. Set them in .env.local for production.");
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
 * Rate limit middleware for API routes.
 * Usage: const { success, limit, remaining } = await checkRateLimit(req);
 * If !success, return 429.
 */
export async function checkRateLimit(req) {
  const limiter = getRatelimiter();
  if (!limiter) return { success: true, limit: Infinity, remaining: Infinity };

  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() 
    || req.headers["x-real-ip"] 
    || req.socket?.remoteAddress 
    || "unknown";

  const { success, limit, remaining } = await limiter.limit(ip);
  return { success, limit, remaining };
}

/**
 * Higher-order function to wrap API handlers with rate limiting.
 */
export function withRateLimit(handler, options = {}) {
  return async (req, res) => {
    const { success, limit, remaining } = await checkRateLimit(req);
    
    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", remaining);

    if (!success) {
      return res.status(429).json({ 
        error: "অনেক বেশি রিকোয়েস্ট। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।" 
      });
    }

    return handler(req, res);
  };
}