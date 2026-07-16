/**
 * Environment variable validation for Nirbhoy
 * 
 * Call validateEnv() at the top of API routes to fail early
 * if required env vars are missing. Only validates on the server.
 */

const REQUIRED_SERVER_VARS = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const OPTIONAL_SERVER_VARS = [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "RESEND_API_KEY",
  "TURNSTILE_SECRET_KEY",
  "SENTRY_DSN",
  "ADMIN_NOTIFY_EMAIL",
];

const REQUIRED_CLIENT_VARS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
];

let validated = false;

/**
 * Validates environment variables on first call.
 * Throws immediately if required vars are missing.
 * Logs warnings for optional vars that are missing.
 */
export function validateEnv() {
  if (validated) return;
  validated = true;

  const missing = [];

  // Check required server-side vars
  for (const key of REQUIRED_SERVER_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}.\n` +
      "Set them in .env.local (see .env.example for reference)."
    );
  }

  // Warn about missing optional vars (only in development)
  if (process.env.NODE_ENV !== "production") {
    for (const key of OPTIONAL_SERVER_VARS) {
      if (!process.env[key]) {
        // Use console.warn here since logger might not be loaded yet
        // eslint-disable-next-line no-console
        console.warn(`[env] Optional env var not set: ${key} — related feature will be disabled`);
      }
    }

    for (const key of REQUIRED_CLIENT_VARS) {
      if (!process.env[key]) {
        // eslint-disable-next-line no-console
        console.warn(`[env] Client env var not set: ${key} — client features may not work`);
      }
    }
  }
}