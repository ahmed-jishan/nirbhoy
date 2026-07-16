import { requireAdminApi } from "../../../lib/session";
import { getComplaintById } from "../../../lib/complaints";
import { signedProofUrl } from "../../../lib/cloudinary";

export default async function handler(req, res) {
  const admin = await requireAdminApi(req, res);
  if (!admin) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { id } = req.query;
  try {
    const complaint = await getComplaintById(id);
    if (!complaint || !complaint.proofs || complaint.proofs.length === 0) {
      return res.status(404).json({ error: "No proof files for this report." });
    }

    const urls = complaint.proofs.map((p) => ({
      publicId: p.publicId,
      resourceType: p.resourceType || "image",
      url: signedProofUrl(p.publicId, p.resourceType || "image"),
    }));

    return res.status(200).json({ urls, expiresInSeconds: 300 });
  } catch (err) {
    console.error("GET /api/admin/proof-url failed:", err);
    return res.status(500).json({ error: "Could not generate links for these files." });
  }
}