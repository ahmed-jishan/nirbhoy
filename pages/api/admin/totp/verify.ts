import { requireAdminApi } from "../../../../lib/session";
import { verifyAndEnableTotp, hasTotpEnabled } from "../../../../lib/totp";
import { logger } from "../../../../lib/logger";

/**
 * POST /api/admin/totp/verify
 *
 * Verifies the TOTP code against the pending secret and permanently
 * enables 2FA for the admin.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed." });
  }

  const admin = await requireAdminApi(req, res);
  if (!admin) return;

  const { code } = req.body || {};
  if (!code || typeof code !== "string" || code.trim().length < 6) {
    return res.status(400).json({ error: "Please enter a valid 6-digit code." });
  }

  // Prevent re-enabling if already active
  const alreadyEnabled = await hasTotpEnabled(admin.uid);
  if (alreadyEnabled) {
    return res.status(400).json({ error: "2FA is already enabled for this account." });
  }

  try {
    const ok = await verifyAndEnableTotp(admin.uid, code.trim());
    if (!ok) {
      return res.status(400).json({ error: "Invalid code. Please try again." });
    }
    return res.status(200).json({ ok: true, message: "Two-factor authentication has been enabled." });
  } catch (err) {
    logger.error({ err, uid: admin.uid }, "TOTP verify failed");
    return res.status(500).json({ error: "Could not verify TOTP code." });
  }
}