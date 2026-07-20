import { getPublicCaseByCaseId } from "../../../lib/updates";
import { applySecurityHeaders } from "../../../lib/securityHeaders";
import { logger } from "../../../lib/logger";

/**
 * GET /api/case/:caseId
 *
 * Returns the public-facing case timeline for a published complaint.
 * Anyone with the caseId can view — no auth required. Non-published
 * complaints are treated as "not found" so we don't leak status.
 */
async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed." });
  }

  const caseId =
    typeof req.query.caseId === "string" ? req.query.caseId.trim().toUpperCase() : "";
  if (!caseId) {
    return res.status(400).json({ error: "Please provide a case ID." });
  }

  try {
    const result = await getPublicCaseByCaseId(caseId);
    if (!result) {
      return res.status(404).json({ error: "এই কেস আইডি দিয়ে কোনো প্রকাশিত রিপোর্ট পাওয়া যায়নি।" });
    }
    return res.status(200).json({ case: result });
  } catch (err) {
    logger.error({ err, caseId }, "GET /api/case/[caseId] failed");
    return res.status(500).json({ error: "কেস লোড করা যায়নি।" });
  }
}

export default function wrappedHandler(req, res) {
  applySecurityHeaders(res);
  return handler(req, res);
}
