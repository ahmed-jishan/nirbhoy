import { requireAdminApi } from "../../../../../lib/session";
import { adminDb } from "../../../../../lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { applySecurityHeaders } from "../../../../../lib/securityHeaders";
import { logger } from "../../../../../lib/logger";

/**
 * PATCH /api/admin/complaints/:id/proofs-visible
 *
 * Toggles the proofsVisible flag on a complaint. Only works on published
 * complaints that have proof files. Admin can disable/enable proof
 * visibility for any case at any time — no need to re-publish.
 */
async function handler(req, res) {
  const admin = await requireAdminApi(req, res);
  if (!admin) return;

  if (req.method !== "PATCH") {
    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { id } = req.query;
  const { proofsVisible } = req.body || {};

  if (typeof proofsVisible !== "boolean") {
    return res.status(400).json({ error: "proofsVisible must be a boolean." });
  }

  try {
    const db = adminDb();
    const ref = db.collection("complaints").doc(id);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Complaint not found." });
    }

    const data = doc.data();
    if (data.status !== "published") {
      return res.status(400).json({ error: "Only published cases can have proof visibility toggled." });
    }

    await ref.update({
      proofsVisible,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      id,
      proofsVisible,
      message: proofsVisible
        ? "প্রমাণ ব্যবহারকারীদের জন্য দৃশ্যমান করা হয়েছে।"
        : "প্রমাণ ব্যবহারকারীদের থেকে লুকানো হয়েছে।",
    });
  } catch (err) {
    logger.error({ err, id }, "PATCH /api/admin/complaints/[id]/proofs-visible failed");
    return res.status(500).json({ error: "Could not toggle proof visibility." });
  }
}

export default function wrappedHandler(req, res) {
  applySecurityHeaders(res);
  return handler(req, res);
}