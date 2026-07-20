import { requireAdminApi } from "../../../../lib/session";
import { generateTotpSecret } from "../../../../lib/totp";
import { logger } from "../../../../lib/logger";

/**
 * POST /api/admin/totp/setup
 *
 * Generates a new TOTP secret for the authenticated admin.
 * Returns the secret and otpauth:// URI for QR code display.
 * The secret is stored as _pendingTotpSecret until verified.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed." });
  }

  const admin = await requireAdminApi(req, res);
  if (!admin) return;

  try {
    const { secret, uri } = await generateTotpSecret(admin.uid, admin.email);
    return res.status(200).json({ secret, uri });
  } catch (err) {
    logger.error({ err, uid: admin.uid }, "TOTP setup failed");
    return res.status(500).json({ error: "Could not generate TOTP secret." });
  }
}