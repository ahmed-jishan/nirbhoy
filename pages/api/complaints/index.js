import { createComplaint, listPublishedComplaints } from "../../../lib/complaints";

const MAX_TITLE = 140;
const MAX_DESC = 4000;
const MAX_LOCATION = 200;

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { type, title, description, location, proofs } = req.body || {};

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
      if (location && location.length > MAX_LOCATION) {
        return res.status(400).json({ error: `Location must be under ${MAX_LOCATION} characters.` });
      }

      const { caseId } = await createComplaint({
        type,
        title: title.trim(),
        description: description.trim(),
        location: (location || "").trim(),
        proofs: Array.isArray(proofs) ? proofs : [],
      });

      return res.status(201).json({ caseId });
    } catch (err) {
      console.error("POST /api/complaints failed:", err);
      return res.status(500).json({ error: "Something went wrong while submitting. Please try again." });
    }
  }

  if (req.method === "GET") {
    try {
      const type = typeof req.query.type === "string" ? req.query.type : null;
      const items = await listPublishedComplaints({ type: type && type !== "all" ? type : null });
      return res.status(200).json({ items });
    } catch (err) {
      console.error("GET /api/complaints failed:", err);
      return res.status(500).json({ error: "Could not load the feed right now." });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method not allowed." });
}