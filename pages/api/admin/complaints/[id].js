import { requireAdminApi } from "../../../../lib/session";
import { getComplaintById, updateComplaintStatus, STATUSES } from "../../../../lib/complaints";
import { applySecurityHeaders } from "../../../../lib/securityHeaders";

async function handler(req, res) {
  const admin = await requireAdminApi(req, res);
  if (!admin) return;

  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const complaint = await getComplaintById(id);
      if (!complaint) return res.status(404).json({ error: "Not found." });
      return res.status(200).json({ complaint });
    } catch (err) {
      console.error("GET /api/admin/complaints/[id] failed:", err);
      return res.status(500).json({ error: "Could not load this report." });
    }
  }

  if (req.method === "PATCH") {
    try {
      const { status, publicTitle, publicSummary, rejectionReason } = req.body || {};
      if (!STATUSES.includes(status)) {
        return res.status(400).json({ error: "Invalid status." });
      }
      if (status === "published" && (!publicSummary || publicSummary.trim().length < 10)) {
        return res.status(400).json({
          error: "Write a short public-safe summary (at least 10 characters) before publishing. Do not include any names.",
        });
      }
      const complaint = await updateComplaintStatus(id, { status, publicTitle, publicSummary, rejectionReason });
      return res.status(200).json({ complaint });
    } catch (err) {
      console.error("PATCH /api/admin/complaints/[id] failed:", err);
      return res.status(500).json({ error: "Could not update this report." });
    }
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({ error: "Method not allowed." });
}

export default function wrappedHandler(req, res) {
  applySecurityHeaders(res);
  return handler(req, res);
}
