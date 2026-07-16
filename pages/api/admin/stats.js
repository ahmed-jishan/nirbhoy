import { requireAdminApi } from "../../../lib/session";
import { applySecurityHeaders } from "../../../lib/securityHeaders";
import { adminDb } from "../../../lib/firebaseAdmin";

async function handler(req, res) {
  const admin = await requireAdminApi(req, res);
  if (!admin) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const db = adminDb();
    const reportsRef = db.collection("complaints");
    const [allSnap, pendingSnap, reviewingSnap, publishedSnap, rejectedSnap] = await Promise.all([
      reportsRef.get(),
      reportsRef.where("status", "==", "pending").get(),
      reportsRef.where("status", "==", "reviewing").get(),
      reportsRef.where("status", "==", "published").get(),
      reportsRef.where("status", "==", "rejected").get(),
    ]);

    const total = allSnap.size;
    let incidentCount = 0;
    let grievanceCount = 0;
    let withProof = 0;
    const dailyCounts = {};

    allSnap.forEach((doc) => {
      const d = doc.data();
      if (d.type === "incident") incidentCount++;
      if (d.type === "grievance") grievanceCount++;
      if (d.proofs && Array.isArray(d.proofs) && d.proofs.length > 0) withProof++;
      
      if (d.createdAt) {
        const date = d.createdAt.toDate().toISOString().split("T")[0];
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      }
    });

    return res.status(200).json({
      stats: {
        total,
        pending: pendingSnap.size,
        reviewing: reviewingSnap.size,
        published: publishedSnap.size,
        rejected: rejectedSnap.size,
        incidentCount,
        grievanceCount,
        withProof,
        dailyCounts: Object.entries(dailyCounts)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-30) // Last 30 days
          .map(([date, count]) => ({ date, count })),
      },
    });
  } catch (err) {
    console.error("GET /api/admin/stats failed:", err);
    return res.status(500).json({ error: "Could not load statistics." });
  }
}

export default function wrappedHandler(req, res) {
  applySecurityHeaders(res);
  return handler(req, res);
}