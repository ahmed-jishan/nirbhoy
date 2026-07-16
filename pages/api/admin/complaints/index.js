import { requireAdminApi } from "../../../../lib/session";
import { listComplaintsForAdmin } from "../../../../lib/complaints";

export default async function handler(req, res) {
  const admin = await requireAdminApi(req, res);
  if (!admin) return; // requireAdminApi already sent the 401

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const status = typeof req.query.status === "string" ? req.query.status : "pending";
    const items = await listComplaintsForAdmin({ status });
    return res.status(200).json({ items });
  } catch (err) {
    console.error("GET /api/admin/complaints failed:", err);
    return res.status(500).json({ error: "Could not load complaints." });
  }
}
