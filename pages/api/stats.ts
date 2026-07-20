import { adminDb } from "../../lib/firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const db = adminDb();
    const complaintsRef = db.collection("complaints");

    // Get all complaints for stats (we only read metadata, no personal data)
    const snapshot = await complaintsRef.get();
    const total = snapshot.size;

    let pending = 0;
    let reviewing = 0;
    let published = 0;
    let rejected = 0;
    let incidents = 0;
    let grievances = 0;

    // District-wise count
    const districtCount: Record<string, number> = {};

    snapshot.forEach((doc) => {
      const data = doc.data();
      const status = data.status || "pending";
      const type = data.type || "grievance";
      const district = data.location?.district || "অজানা";

      if (status === "pending") pending++;
      else if (status === "reviewing") reviewing++;
      else if (status === "published") published++;
      else if (status === "rejected") rejected++;

      if (type === "incident") incidents++;
      else grievances++;

      districtCount[district] = (districtCount[district] || 0) + 1;
    });

    // Sort districts by count descending, take top 10
    const topDistricts = Object.entries(districtCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return res.status(200).json({
      total,
      pending,
      reviewing,
      published,
      rejected,
      incidents,
      grievances,
      topDistricts,
    });
  } catch (err) {
    console.error("Stats API error:", err);
    return res.status(500).json({ error: "পরিসংখ্যান লোড করা যায়নি।" });
  }
}