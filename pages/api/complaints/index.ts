import { createComplaint, listPublishedComplaints } from "../../../lib/complaints";
import { withRateLimit } from "../../../lib/rateLimit";
import { applySecurityHeaders } from "../../../lib/securityHeaders";
import { verifyTurnstileToken } from "../../../lib/captcha";
import { notifyNewComplaint, notifyUrgentIncident } from "../../../lib/email";
import { logger } from "../../../lib/logger";

const MAX_TITLE = 140;
const MAX_DESC = 4000;
const MAX_LOCATION = 200;

async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { type, title, description, location, proofs, captchaToken } = req.body || {};

      // Verify CAPTCHA if configured
      const captchaValid = await verifyTurnstileToken(captchaToken);
      if (!captchaValid) {
        return res.status(400).json({ error: "CAPTCHA যাচাই ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।" });
      }

      if (!["incident", "grievance"].includes(type)) {
        return res.status(400).json({ error: "Invalid complaint type." });
      }
      if (!title || typeof title !== "string" || title.trim().length < 4) {
        return res.status(400).json({ error: "Please add a short title (at least 4 characters)." });
      }
      if (!description || typeof description !== "string" || description.trim().length < 20) {
        return res.status(400).json({ error: "Please describe what happened in a bit more detail (at least 20 characters)." });
      }
      if (title.length > MAX_TITLE) {
        return res.status(400).json({ error: `Title must be under ${MAX_TITLE} characters.` });
      }
      if (description.length > MAX_DESC) {
        return res.status(400).json({ error: `Description must be under ${MAX_DESC} characters.` });
      }
      const { caseId } = await createComplaint({
        type,
        title: title.trim(),
        description: description.trim(),
        location: location || "",
        proofs: Array.isArray(proofs) ? proofs : [],
      });

      // Send notifications (non-blocking — don't await)
      notifyNewComplaint(caseId, title.trim(), type);
      if (type === "incident") {
        notifyUrgentIncident(caseId, title.trim(), description.trim());
      }

      return res.status(201).json({ caseId });
    } catch (err) {
      logger.error({ err }, "POST /api/complaints failed");
      return res.status(500).json({ error: "Something went wrong while submitting. Please try again." });
    }
  }

  if (req.method === "GET") {
    try {
      const type = typeof req.query.type === "string" ? req.query.type : null;
      const items = await listPublishedComplaints({ type: type && type !== "all" ? type : null });
      return res.status(200).json({ items });
    } catch (err) {
      logger.error({ err }, "GET /api/complaints failed");
      return res.status(500).json({ error: "Could not load the feed right now." });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method not allowed." });
}

// Wrap with rate limiting on POST (submissions) and security headers on all
export default function wrappedHandler(req, res) {
  applySecurityHeaders(res);
  if (req.method === "POST") {
    return withRateLimit(handler)(req, res);
  }
  return handler(req, res);
}
