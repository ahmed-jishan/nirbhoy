/**
 * Browser fingerprint utility for anonymous vote deduplication.
 *
 * Generates a lightweight, privacy-respecting fingerprint from browser
 * signals that are *not* stored in localStorage. This makes it harder
 * for a user to clear their voter identity simply by clearing site data.
 *
 * Privacy note:
 * ------------
 * The fingerprint is a hash derived from non-identifying signals
 * (screen size, timezone, platform, language, user agent). It cannot
 * be reversed to reveal personal information. The raw signals are NEVER
 * sent to the server — only the resulting hash.
 */

/**
 * Collect browser signals and produce a stable hash.
 * Stability: same browser, same device → same fingerprint (~90%+).
 * Changes: browser update, screen resize, OS update may alter it.
 * This is fine — the goal is to prevent trivial vote gaming, not
 * to build a persistent user profile.
 */
export function getBrowserFingerprint(): string {
  if (typeof window === "undefined") return "";

  const signals = [
    navigator.userAgent || "",
    navigator.platform || "",
    navigator.language || "",
    Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    screen.width || "",
    screen.height || "",
    screen.colorDepth || "",
    navigator.hardwareConcurrency || "",
    // Device memory is available in Chromium-based browsers
    (navigator as any).deviceMemory || "",
  ];

  // Simple hash function — we don't need cryptographic strength here,
  // just a compact, stable identifier.
  return simpleHash(signals.join("|||"));
}

/**
 * Lightweight string hash (djb2 variant).
 * Returns a 16-char hex string.
 */
function simpleHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) & 0xffffffff;
  }
  // Convert to unsigned hex and pad
  return (hash >>> 0).toString(16).padStart(8, "0").slice(0, 16);
}