import { adminDb } from "../../../lib/firebaseAdmin";

/**
 * Known Bangladeshi district names (Bengali) for extracting district
 * from the free-text location string stored in Firestore.
 */
const KNOWN_DISTRICTS = [
  "ঢাকা", "চট্টগ্রাম", "রাজশাহী", "খুলনা", "সিলেট", "বরিশাল", "রংপুর", "ময়মনসিংহ",
  "কুমিল্লা", "নারায়ণগঞ্জ", "গাজীপুর", "বগুড়া", "যশোর", "কক্সবাজার", "দিনাজপুর",
  "পাবনা", "টাঙ্গাইল", "নোয়াখালী", "ফেনী", "ব্রাহ্মণবাড়িয়া", "সিরাজগঞ্জ", "নাটোর",
  "কুষ্টিয়া", "মাদারীপুর", "ফরিদপুর", "লক্ষ্মীপুর", "চাঁদপুর", "হবিগঞ্জ", "মৌলভীবাজার",
  "সুনামগঞ্জ", "নেত্রকোনা", "কিশোরগঞ্জ", "মানিকগঞ্জ", "জামালপুর", "শেরপুর", "গোপালগঞ্জ",
  "পটুয়াখালী", "ভোলা", "পিরোজপুর", "বরগুনা", "ঝালকাঠি", "সাতক্ষীরা", "মাগুরা",
  "নড়াইল", "চুয়াডাঙ্গা", "মেহেরপুর", "ঝিনাইদহ", "রাজবাড়ী", "শরীয়তপুর", "মুন্সিগঞ্জ",
  "নরসিংদী", "বান্দরবান", "রাঙ্গামাটি", "খাগড়াছড়ি", "লালমনিরহাট", "কুড়িগ্রাম",
  "গাইবান্ধা", "নীলফামারী", "পঞ্চগড়", "ঠাকুরগাঁও", "জয়পুরহাট", "নওগাঁ",
];

/**
 * Extract district name from a location string or object.
 * Firestore stores location as a string like "ঢাকা, সদর, বাংলাদেশ"
 * or as an object with a district property.
 */
function extractDistrict(location: any): string {
  if (!location) return "অজানা";
  
  // If location is an object with a district property
  if (typeof location === "object" && location.district) {
    return location.district;
  }
  
  // If location is a string, try to match known district names
  if (typeof location === "string") {
    for (const district of KNOWN_DISTRICTS) {
      if (location.includes(district)) {
        return district;
      }
    }
  }
  
  return "অজানা";
}

/**
 * GET /api/stats/trends
 *
 * Returns time-series data for trend analysis:
 * - Monthly report counts (total, incidents, grievances)
 * - District-wise breakdown
 * - Status distribution over time
 *
 * Response:
 * {
 *   monthly: { month: string, total: number, incidents: number, grievances: number }[],
 *   districtData: { name: string, incidents: number, grievances: number, total: number }[],
 *   statusDistribution: { name: string, value: number }[],
 *   summary: { total, published, pending, reviewing, rejected }
 * }
 */

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const db = adminDb();
    const complaintsRef = db.collection("complaints");
    const snapshot = await complaintsRef.get();

    // Monthly aggregation
    const monthlyMap: Record<string, { total: number; incidents: number; grievances: number }> = {};

    // District aggregation
    const districtMap: Record<string, { incidents: number; grievances: number; total: number }> = {};

    // Status counts
    let pending = 0;
    let reviewing = 0;
    let published = 0;
    let rejected = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const type = data.type || "grievance";
      const status = data.status || "pending";
      const district = extractDistrict(data.location);
      const createdAt = data.createdAt || data.publishedAt || null;

      // Status counts
      if (status === "pending") pending++;
      else if (status === "reviewing") reviewing++;
      else if (status === "published") published++;
      else if (status === "rejected") rejected++;

      // District aggregation
      if (!districtMap[district]) {
        districtMap[district] = { incidents: 0, grievances: 0, total: 0 };
      }
      districtMap[district].total++;
      if (type === "incident") districtMap[district].incidents++;
      else districtMap[district].grievances++;

      // Monthly aggregation
      if (createdAt) {
        let date: Date;
        if (typeof createdAt === "string" || typeof createdAt === "number") {
          date = new Date(createdAt);
        } else if (createdAt.toDate) {
          // Firestore Timestamp
          date = createdAt.toDate();
        } else {
          return;
        }

        if (isNaN(date.getTime())) return;

        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = { total: 0, incidents: 0, grievances: 0 };
        }
        monthlyMap[monthKey].total++;
        if (type === "incident") monthlyMap[monthKey].incidents++;
        else monthlyMap[monthKey].grievances++;
      }
    });

    // Convert monthly map to sorted array
    const monthly = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, counts]) => ({
        month,
        total: counts.total,
        incidents: counts.incidents,
        grievances: counts.grievances,
      }));

    // Convert district map to sorted array (by total descending)
    const districtData = Object.entries(districtMap)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 15) // Top 15 districts
      .map(([name, counts]) => ({
        name,
        total: counts.total,
        incidents: counts.incidents,
        grievances: counts.grievances,
      }));

    // Status distribution for pie chart
    const statusDistribution = [
      { name: "অপেক্ষমান", value: pending, color: "#64748B" },
      { name: "পর্যালোচনায়", value: reviewing, color: "#0D9488" },
      { name: "প্রকাশিত", value: published, color: "#14B8A6" },
      { name: "প্রত্যাখ্যাত", value: rejected, color: "#DC2626" },
    ].filter((s) => s.value > 0);

    const total = pending + reviewing + published + rejected;

    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600");
    return res.status(200).json({
      monthly,
      districtData,
      statusDistribution,
      summary: { total, pending, reviewing, published, rejected },
    });
  } catch (err) {
    console.error("Trends API error:", err);
    return res.status(500).json({ error: "ট্রেন্ড ডাটা লোড করা যায়নি।" });
  }
}