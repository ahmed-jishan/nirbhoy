/**
 * Cloudflare Turnstile CAPTCHA verification
 * 
 * Add NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY to .env.local
 * 
 * Get keys from: https://dash.cloudflare.com/?to=/:account/turnstile
 */

import { logger } from "./logger";

export function getTurnstileSiteKey() {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
}

/**
 * Server-side verification of Turnstile token
 */
export async function verifyTurnstileToken(token) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    logger.warn("TURNSTILE_SECRET_KEY not set — CAPTCHA verification disabled");
    return true; // Allow if not configured (dev mode)
  }
  if (!token) return false;

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }),
      }
    );
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}