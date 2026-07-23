import { Html, Head, Main, NextScript } from "next/document";
import crypto from "crypto";

/**
 * Custom Document.
 *
 * Note: Google Fonts CDN links have been removed. Fonts are loaded via
 * `next/font/google` in `pages/_app.tsx`, which self-hosts the font files
 * at build time. This prevents leaking any visitor's IP to Google.
 */

/** Generate a CSP nonce for this request — one per page render. */
function generateNonce() {
  return crypto.randomBytes(16).toString("base64");
}

export default function Document() {
  const nonce = generateNonce();
  const isDev = process.env.NODE_ENV === "development";
  const csp = isDev
    ? [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https://res.cloudinary.com https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org https://server.arcgisonline.com https://tiles.openfreemap.org",
        "media-src 'self' blob: https://res.cloudinary.com",
        "connect-src 'self' https://api.cloudinary.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://tiles.openfreemap.org ws:",
        "worker-src 'self' blob:",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ].join("; ")
    : [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com`,
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https://res.cloudinary.com https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org https://server.arcgisonline.com https://tiles.openfreemap.org",
        "media-src 'self' blob: https://res.cloudinary.com",
        "connect-src 'self' https://api.cloudinary.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://nominatim.openstreetmap.org https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org https://server.arcgisonline.com https://tiles.openfreemap.org",
        "worker-src 'self' blob:",
        "frame-src https://challenges.cloudflare.com",
        "child-src https://challenges.cloudflare.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ].join("; ");

  return (
    <Html lang="bn">
      <Head>
        <meta
          name="description"
          content="Nirbhoy — নিরাপদে, নাম প্রকাশ ছাড়াই আপনার এলাকার সমস্যা তুলে ধরুন।"
        />
        <meta httpEquiv="Content-Security-Policy" content={csp} />
        <link rel="icon" href="/favicon.svg" />
        <link rel="manifest" href="/manifest.json" />
        {/* ── Default Open Graph / Twitter Card meta (per-page overrides in <Head>) ── */}
        <meta property="og:site_name" content="Nirbhoy" />
        <meta property="og:locale" content="bn_BD" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://nirbhoy.org/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@nirbhoy" />
        <meta name="twitter:creator" content="@nirbhoy" />
        <meta name="theme-color" content="#0D9488" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Nirbhoy" />
        {/* Explicitly disable referrer so outbound links don't leak the
            reporter's current URL (which may contain a case ID). */}
        <meta name="referrer" content="no-referrer" />
      </Head>
      <body>
        <Main />
        <NextScript nonce={nonce} />
      </body>
    </Html>
  );
}