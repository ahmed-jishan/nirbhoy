import { adminAuth, adminDb } from "../../../lib/firebaseAdmin";
import { createSessionCookie, sessionCookieHeader, clearSessionCookieHeader } from "../../../lib/session";
import { hasTotpEnabled, verifyTotpCode } from "../../../lib/totp";
import { logger } from "../../../lib/logger";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { idToken, totpCode } = req.body || {};
      if (!idToken) {
        return res.status(400).json({ error: "Missing ID token." });
      }

      // Verify the token is genuinely from Firebase Auth first.
      const decoded = await adminAuth().verifyIdToken(idToken);

      // Then check the allowlist — being a valid Firebase user is not
      // enough, the uid must also be in the admins collection.
      const allow = await adminDb().collection("admins").doc(decoded.uid).get();
      if (!allow.exists) {
        return res.status(403).json({ error: "This account is not authorized as an admin." });
      }

      // If 2FA is enabled, require a valid TOTP code.
      const totpActive = await hasTotpEnabled(decoded.uid);
      if (totpActive) {
        if (!totpCode || typeof totpCode !== "string") {
          return res.status(400).json({ error: "totp_required", message: "Two-factor authentication code is required." });
        }
        const valid = await verifyTotpCode(decoded.uid, totpCode.trim());
        if (!valid) {
          return res.status(401).json({ error: "Invalid two-factor authentication code." });
        }
      }

      const sessionCookie = await createSessionCookie(idToken);
      res.setHeader("Set-Cookie", sessionCookieHeader(sessionCookie, 12 * 60 * 60));
      return res.status(200).json({ ok: true });
    } catch (err) {
      logger.error({ err }, "POST /api/admin/session failed");
      return res.status(401).json({ error: "Login failed. Please check your email and password." });
    }
  }

  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", clearSessionCookieHeader());
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", ["POST", "DELETE"]);
  return res.status(405).json({ error: "Method not allowed." });
}
