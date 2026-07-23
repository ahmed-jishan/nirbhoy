import { requireAdminApi } from "../../../lib/session";
import { applySecurityHeaders } from "../../../lib/securityHeaders";
import { adminDb } from "../../../lib/firebaseAdmin";
import { logger } from "../../../lib/logger";

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
    const dailyCounts: Record<string, number> = {};
    const divisionCounts: Record<string, number> = {};
    const districtCounts: Record<string, number> = {};

    // Known Bangladesh divisions for parsing
    const DIVISIONS = ["ঢাকা", "চট্টগ্রাম", "রাজশাহী", "খুলনা", "সিলেট", "বরিশাল", "রংপুর", "ময়মনসিংহ"];

    allSnap.forEach((doc) => {
      const d = doc.data();
      if (d.type === "incident") incidentCount++;
      if (d.type === "grievance") grievanceCount++;
      if (d.proofs && Array.isArray(d.proofs) && d.proofs.length > 0) withProof++;
      
      if (d.createdAt) {
        const date = d.createdAt.toDate().toISOString().split("T")[0];
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      }

      // Parse location for division and district
      const locationStr = d.location || "";
      const parts = locationStr.split(",").map((s) => s.trim()).filter(Boolean);
      
      // Location format: detail, city, thana, district, division, postOffice, postalCode
      // Division is typically the 4th index (0-based), district is 3rd
      let division = "";
      let district = "";

      // Try to find division from parts
      for (const p of parts) {
        if (DIVISIONS.includes(p)) {
          division = p;
          break;
        }
      }

      // District is usually the part before division
      if (division) {
        const divIndex = parts.indexOf(division);
        if (divIndex > 0) {
          district = parts[divIndex - 1];
        }
      } else if (parts.length >= 2) {
        // Fallback: use second-to-last as district
        district = parts[parts.length - 2];
      }

      if (division) {
        divisionCounts[division] = (divisionCounts[division] || 0) + 1;
      }
      if (district) {
        const key = district;
        districtCounts[key] = (districtCounts[key] || 0) + 1;
      }
    });

    // Build division breakdown
    const divisionBreakdown = Object.entries(divisionCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }));

    // Top 10 districts overall
    const topDistricts = Object.entries(districtCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }));

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
          .slice(-30)
          .map(([date, count]) => ({ date, count })),
        divisionBreakdown,
        topDistricts,
      },
    });
  } catch (err) {
    logger.error({ err }, "GET /api/admin/stats failed");
    return res.status(500).json({ error: "Could not load statistics." });
  }
}

export default function wrappedHandler(req, res) {
  applySecurityHeaders(res);
  return handler(req, res);
}