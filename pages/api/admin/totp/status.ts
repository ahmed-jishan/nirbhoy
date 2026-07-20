import { requireAdminApi } from "../../../../lib/session";
import { hasTotpEnabled } from "../../../../lib/totp";

/**
 * GET /api/admin/totp/status
 *
 * Returns whether 2FA is enabled for the current admin.
 * Used by the admin settings page to show current state.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed." });
  }

  const admin = await requireAdminApi(req, res);
  if (!admin) return;

  const enabled = await hasTotpEnabled(admin.uid);
  return res.status(200).json({ enabled });
}