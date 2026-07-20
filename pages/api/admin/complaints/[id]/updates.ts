import { requireAdminApi } from "../../../../../lib/session";
import {
  addComplaintUpdate,
  listComplaintUpdates,
  deleteComplaintUpdate,
  UPDATE_TYPES,
} from "../../../../../lib/updates";
import { applySecurityHeaders } from "../../../../../lib/securityHeaders";
import { logger } from "../../../../../lib/logger";

/**
 * /api/admin/complaints/:id/updates
 *
 * GET    — list all updates (public + private) for the review panel.
 * POST   — add a new update (moderator only).
 * DELETE — remove an update by `updateId` query param.
 */
async function handler(req, res) {
  const admin = await requireAdminApi(req, res);
  if (!admin) return;

  const { id } = req.query;
  if (typeof id !== "string" || !id) {
    return res.status(400).json({ error: "Missing complaint id." });
  }

  if (req.method === "GET") {
    try {
      const updates = await listComplaintUpdates(id, "all");
      return res.status(200).json({ updates });
    } catch (err) {
      logger.error({ err, id }, "GET admin updates failed");
      return res.status(500).json({ error: "Could not load updates." });
    }
  }

  if (req.method === "POST") {
    try {
      const { title, message, type, isPublic } = req.body || {};
      if (!UPDATE_TYPES.includes(type)) {
        return res.status(400).json({ error: "Invalid update type." });
      }
      const result = await addComplaintUpdate({
        complaintId: id,
        title,
        message,
        type,
        isPublic: Boolean(isPublic),
        authorEmail: admin.email || null,
      });
      return res.status(201).json(result);
    } catch (err) {
      const msg = err?.message || "Could not add update.";
      logger.error({ err, id }, "POST admin update failed");
      return res.status(400).json({ error: msg });
    }
  }

  if (req.method === "DELETE") {
    try {
      const updateId = typeof req.query.updateId === "string" ? req.query.updateId : "";
      if (!updateId) {
        return res.status(400).json({ error: "Missing updateId." });
      }
      const removed = await deleteComplaintUpdate(id, updateId);
      if (!removed) return res.status(404).json({ error: "Update not found." });
      return res.status(200).json({ ok: true });
    } catch (err) {
      logger.error({ err, id }, "DELETE admin update failed");
      return res.status(500).json({ error: "Could not delete update." });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).json({ error: "Method not allowed." });
}

export default function wrappedHandler(req, res) {
  applySecurityHeaders(res);
  return handler(req, res);
}
