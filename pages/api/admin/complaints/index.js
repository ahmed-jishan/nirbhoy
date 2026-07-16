import { requireAdminApi } from "../../../../lib/session";
import { listComplaintsForAdmin, DEFAULT_PAGE_SIZE } from "../../../../lib/complaints";
import { applySecurityHeaders } from "../../../../lib/securityHeaders";
import { logger } from "../../../../lib/logger";

async function handler(req, res) {
  const admin = await requireAdminApi(req, res);
  if (!admin) return; // requireAdminApi already sent the 401

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed." });
  }

  const status = typeof req.query.status === "string" ? req.query.status : "pending";

  try {
    const limit = parseInt(req.query.limit) || DEFAULT_PAGE_SIZE;
    const startAfter = typeof req.query.startAfter === "string" ? req.query.startAfter : null;
    
    const { items, hasMore, lastId } = await listComplaintsForAdmin({ status, limit, startAfter });
    
    return res.status(200).json({ 
      items, 
      pagination: { hasMore, lastId, pageSize: limit }
    });
  } catch (err) {
    logger.error({ err, status }, "GET /api/admin/complaints failed");
    return res.status(500).json({ error: "Could not load complaints." });
  }
}

export default function wrappedHandler(req, res) {
  applySecurityHeaders(res);
  return handler(req, res);
}