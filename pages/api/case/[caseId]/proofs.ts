import { adminDb } from "../../../../lib/firebaseAdmin";
import { applySecurityHeaders } from "../../../../lib/securityHeaders";
import { signedProofUrl } from "../../../../lib/cloudinary";
import { logger } from "../../../../lib/logger";

/**
 * GET /api/case/:caseId/proofs
 *
 * Returns short-lived (5-minute) signed Cloudinary URLs for proof files
 * attached to a published complaint. Only works when:
 *   1. The complaint is published
 *   2. The admin has set `proofsVisible: true`
 *
 * This ensures proof files are never publicly guessable — only viewers
 * who know the caseId can see them, and the URLs expire after 5 minutes.
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
    const db = adminDb();
    const snap = await db
      .collection("complaints")
      .where("caseId", "==", caseId)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(404).json({ error: "Case not found." });
    }

    const doc = snap.docs[0];
    const d = doc.data();

    // Only serve proofs for published cases with admin opt-in
    if (d.status !== "published" || !d.proofsVisible) {
      return res.status(403).json({ error: "Proofs are not available for this case." });
    }

    if (!Array.isArray(d.proofs) || d.proofs.length === 0) {
      return res.status(404).json({ error: "No proofs for this case." });
    }

    // Generate short-lived signed URLs
    const proofs = d.proofs.map((p: any) => {
      const publicId = p.publicId;
      const resourceType = p.resourceType || "image";
      const url = signedProofUrl(publicId, resourceType);
      return { publicId, resourceType, url };
    });

    return res.status(200).json({ proofs, expiresInSeconds: 300 });
  } catch (err) {
    logger.error({ err, caseId }, "GET /api/case/[caseId]/proofs failed");
    return res.status(500).json({ error: "Could not load proofs." });
  }
}

export default function wrappedHandler(req, res) {
  applySecurityHeaders(res);
  return handler(req, res);
}