import { toggleUpvote, hasVoted, getUpvoteCount } from "../../../../lib/votes";
import { applySecurityHeaders } from "../../../../lib/securityHeaders";
import { logger } from "../../../../lib/logger";

/**
 * /api/case/:caseId/vote
 *
 * GET  ?token=xxx  → returns { voted, count }
 * POST { token }   → toggles the vote and returns the new state
 *
 * The `token` is a random UUID the client generates once and stores in
 * localStorage. We never see any personal data.
 */
async function handler(req, res) {
  const caseId =
    typeof req.query.caseId === "string" ? req.query.caseId.trim().toUpperCase() : "";
  if (!caseId) {
    return res.status(400).json({ error: "Missing case id." });
  }

  if (req.method === "GET") {
    try {
      const token = typeof req.query.token === "string" ? req.query.token : "";
      const [count, voted] = await Promise.all([
        getUpvoteCount(caseId),
        token ? hasVoted(caseId, token) : Promise.resolve(false),
      ]);
      return res.status(200).json({ count, voted });
    } catch (err) {
      logger.error({ err, caseId }, "GET vote failed");
      return res.status(500).json({ error: "Could not read votes." });
    }
  }

  if (req.method === "POST") {
    try {
      const { token } = req.body || {};
      if (!token || typeof token !== "string" || token.length < 10) {
        return res.status(400).json({ error: "Invalid voter token." });
      }
      const result = await toggleUpvote(caseId, token);
      return res.status(200).json(result);
    } catch (err) {
      const msg = err?.message || "Could not toggle vote.";
      logger.warn({ err: String(msg), caseId }, "POST vote failed");
      return res.status(400).json({ error: msg });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method not allowed." });
}

export default function wrappedHandler(req, res) {
  applySecurityHeaders(res);
  return handler(req, res);
}
