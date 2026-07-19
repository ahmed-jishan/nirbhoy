/**
 * Security headers middleware for API routes
 * Adds important security headers to every response
 */

export function applySecurityHeaders(res) {
  const headers = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
    "Cross-Origin-Embedder-Policy": "require-corp",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
  };

  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
}

/**
 * Content-Security-Policy for HTML pages (nonce-based)
 * Only apply to page renders, not API routes
 */
export function getCspHeader(nonce) {
  return `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://res.cloudinary.com; media-src 'self' blob: https://res.cloudinary.com; connect-src 'self' https://api.cloudinary.com; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'`;
}

/**
 * Wrapper to add security headers to API handlers
 */
export function withSecurityHeaders(handler) {
  return async (req, res) => {
    applySecurityHeaders(res);
    return handler(req, res);
  };
}