import { getComplaintStatusByCaseId } from "../../../lib/complaints";
import { applySecurityHeaders } from "../../../lib/securityHeaders";

async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed." });
  }

  const caseId = typeof req.query.caseId === "string" ? req.query.caseId.trim().toUpperCase() : "";
  if (!caseId) {
    return res.status(400).json({ error: "Please provide a case ID." });
  }

  try {
    const result = await getComplaintStatusByCaseId(caseId);
    if (!result) {
      return res.status(404).json({ error: "No report found with that case ID." });
    }
    return res.status(200).json(result);
  } catch (err) {
    console.error("GET /api/complaints/status failed:", err);
    return res.status(500).json({ error: "Could not check status right now." });
  }
}

export default function wrappedHandler(req, res) {
  applySecurityHeaders(res);
  return handler(req, res);
}
