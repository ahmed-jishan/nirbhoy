import { requireAdminApi } from "../../../lib/session";
import { applySecurityHeaders } from "../../../lib/securityHeaders";
import { adminDb } from "../../../lib/firebaseAdmin";
import { logger } from "../../../lib/logger";

const ROLES = ["super_admin", "moderator", "viewer"];

async function handler(req, res) {
  const admin = await requireAdminApi(req, res);
  if (!admin) return;

  // Only super_admin can manage users
  if ((admin as any).role !== "super_admin") {
    return res.status(403).json({ error: "Only super admins can manage moderators." });
  }

  if (req.method === "GET") {
    try {
      const snap = await adminDb().collection("admins").get();
      const users = snap.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()?.toISOString() || null,
      }));
      return res.status(200).json({ users });
    } catch (err) {
      logger.error({ err }, "GET /api/admin/users failed");
      return res.status(500).json({ error: "Could not load users." });
    }
  }

  if (req.method === "PATCH") {
    try {
      const { uid, role } = req.body || {};
      if (!uid || !ROLES.includes(role)) {
        return res.status(400).json({ error: "Invalid uid or role." });
      }
      await adminDb().collection("admins").doc(uid).update({ role });
      return res.status(200).json({ success: true });
    } catch (err) {
      logger.error({ err, uid: req.body?.uid }, "PATCH /api/admin/users failed");
      return res.status(500).json({ error: "Could not update user." });
    }
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({ error: "Method not allowed." });
}

export default function wrappedHandler(req, res) {
  applySecurityHeaders(res);
  return handler(req, res);
}