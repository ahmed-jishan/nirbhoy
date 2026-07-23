import { toggleUpvote, hasVoted, getUpvoteCount } from "../../../../lib/votes";
import { applySecurityHeaders } from "../../../../lib/securityHeaders";
import { withRateLimit } from "../../../../lib/rateLimit";
import { logger } from "../../../../lib/logger";

/**
 * /api/case/:caseId/vote
 *
 * GET  ?token=xxx&fingerprint=yyy  → returns { voted, count }
 * POST { token, fingerprint? }     → toggles the vote and returns the new state
 *
 * Two-layer anti-gaming:
 *  1. Voter token — random UUID stored in localStorage.
 *  2. Browser fingerprint — lightweight hash of non-identifying browser
 *     signals (screen, timezone, platform, etc.). This survives localStorage
 *     clears. Both are combined in the server-side voteId hash.
 *
 * Rate limiting — max 10 POST requests per 60 seconds per IP to prevent
 * automated vote spam.
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
      const fingerprint = typeof req.query.fingerprint === "string" ? req.query.fingerprint : "";
      const [count, voted] = await Promise.all([
        getUpvoteCount(caseId),
        token ? hasVoted(caseId, token, fingerprint) : Promise.resolve(false),
      ]);
      return res.status(200).json({ count, voted });
    } catch (err) {
      logger.error({ err, caseId }, "GET vote failed");
      return res.status(500).json({ error: "Could not read votes." });
    }
  }

  if (req.method === "POST") {
    try {
      const { token, fingerprint } = req.body || {};
      if (!token || typeof token !== "string" || token.length < 10) {
        return res.status(400).json({ error: "Invalid voter token." });
      }
      const fp = typeof fingerprint === "string" && fingerprint.length > 0 ? fingerprint : undefined;
      const result = await toggleUpvote(caseId, token, fp);
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

// Apply rate limiting to POST (vote toggle) — limit to 10 requests
// per 60 seconds per IP to prevent automated abuse. GET reads are
// not rate limited since they're read-only and cheap.
const rateLimitedHandler = withRateLimit(handler, { limit: 10, windowMs: 60000 });

export default function wrappedHandler(req, res) {
  applySecurityHeaders(res);
  return rateLimitedHandler(req, res);
}
