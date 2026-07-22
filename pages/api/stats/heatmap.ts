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
 */
function extractDistrict(location: any): string {
  if (!location) return "";
  if (typeof location === "object" && location.district) return location.district;
  if (typeof location === "string") {
    for (const district of KNOWN_DISTRICTS) {
      if (location.includes(district)) return district;
    }
  }
  return "";
}

/**
 * GET /api/stats/heatmap
 *
 * Returns aggregated geo-coordinates for heatmap rendering.
 * Groups published complaints by district centroid (approximate)
 * and returns exact-location pins where available.
 */

// Approximate district centroids for Bangladesh (lat, lng)
// Used when exact coordinates aren't available
const DISTRICT_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  "ঢাকা": { lat: 23.8103, lng: 90.4125 },
  "চট্টগ্রাম": { lat: 22.3569, lng: 91.7832 },
  "রাজশাহী": { lat: 24.3745, lng: 88.6042 },
  "খুলনা": { lat: 22.8456, lng: 89.5403 },
  "সিলেট": { lat: 24.8949, lng: 91.8687 },
  "বরিশাল": { lat: 22.7010, lng: 90.3535 },
  "রংপুর": { lat: 25.7439, lng: 89.2752 },
  "ময়মনসিংহ": { lat: 24.7471, lng: 90.4203 },
  "কুমিল্লা": { lat: 23.4607, lng: 91.1809 },
  "নারায়ণগঞ্জ": { lat: 23.6213, lng: 90.4950 },
  "গাজীপুর": { lat: 23.9994, lng: 90.4203 },
  "বগুড়া": { lat: 24.8487, lng: 89.3699 },
  "যশোর": { lat: 23.1634, lng: 89.2188 },
  "কক্সবাজার": { lat: 21.4414, lng: 92.0092 },
  "দিনাজপুর": { lat: 25.6279, lng: 88.6426 },
  "পাবনা": { lat: 24.0055, lng: 89.2372 },
  "টাঙ্গাইল": { lat: 24.2474, lng: 89.9149 },
  "নোয়াখালী": { lat: 22.8619, lng: 91.1020 },
  "ফেনী": { lat: 23.0153, lng: 91.3975 },
  "ব্রাহ্মণবাড়িয়া": { lat: 23.9592, lng: 91.1099 },
  "সিরাজগঞ্জ": { lat: 24.4535, lng: 89.7007 },
  "নাটোর": { lat: 24.4150, lng: 88.9865 },
  "কুষ্টিয়া": { lat: 23.9133, lng: 89.1195 },
  "মাদারীপুর": { lat: 23.1650, lng: 90.2070 },
  "ফরিদপুর": { lat: 23.6037, lng: 89.8439 },
  "লক্ষ্মীপুর": { lat: 22.9442, lng: 90.8282 },
  "চাঁদপুর": { lat: 23.2350, lng: 90.6675 },
  "হবিগঞ্জ": { lat: 24.3733, lng: 91.4113 },
  "মৌলভীবাজার": { lat: 24.4808, lng: 91.7725 },
  "সুনামগঞ্জ": { lat: 25.0705, lng: 91.4022 },
  "নেত্রকোনা": { lat: 24.8823, lng: 90.7295 },
  "কিশোরগঞ্জ": { lat: 24.4380, lng: 90.7833 },
  "মানিকগঞ্জ": { lat: 23.8587, lng: 90.0050 },
  "জামালপুর": { lat: 24.9366, lng: 89.9360 },
  "শেরপুর": { lat: 25.0220, lng: 90.0222 },
  "গোপালগঞ্জ": { lat: 23.2064, lng: 89.8281 },
  "পটুয়াখালী": { lat: 22.3596, lng: 90.3305 },
  "ভোলা": { lat: 22.6875, lng: 90.6520 },
  "পিরোজপুর": { lat: 22.5783, lng: 89.9758 },
  "বরগুনা": { lat: 22.1563, lng: 90.1314 },
  "ঝালকাঠি": { lat: 22.6426, lng: 90.2004 },
  "সাতক্ষীরা": { lat: 22.3809, lng: 89.1034 },
  "মাগুরা": { lat: 23.4879, lng: 89.4179 },
  "নড়াইল": { lat: 23.1525, lng: 89.5025 },
  "চুয়াডাঙ্গা": { lat: 23.6469, lng: 88.8561 },
  "মেহেরপুর": { lat: 23.7813, lng: 88.6592 },
  "ঝিনাইদহ": { lat: 23.5444, lng: 89.1797 },
  "রাজবাড়ী": { lat: 23.7571, lng: 89.6432 },
  "শরীয়তপুর": { lat: 23.2945, lng: 90.3676 },
  "মুন্সিগঞ্জ": { lat: 23.5434, lng: 90.5373 },
  "নরসিংদী": { lat: 23.9284, lng: 90.7146 },
  "বান্দরবান": { lat: 21.9934, lng: 92.3998 },
  "রাঙ্গামাটি": { lat: 22.6546, lng: 92.1758 },
  "খাগড়াছড়ি": { lat: 23.0464, lng: 91.9625 },
  "লালমনিরহাট": { lat: 25.9999, lng: 89.4500 },
  "কুড়িগ্রাম": { lat: 25.8109, lng: 89.6500 },
  "গাইবান্ধা": { lat: 25.3287, lng: 89.5426 },
  "নীলফামারী": { lat: 25.9300, lng: 88.8500 },
  "পঞ্চগড়": { lat: 26.3335, lng: 88.5570 },
  "ঠাকুরগাঁও": { lat: 25.9500, lng: 88.1500 },
  "জয়পুরহাট": { lat: 25.1015, lng: 89.0238 },
  "নওগাঁ": { lat: 24.8035, lng: 88.9514 },
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const db = adminDb();
    const complaintsRef = db.collection("complaints");

    // Only fetch published complaints with location data
    const snapshot = await complaintsRef
      .where("status", "==", "published")
      .get();

    const points: [number, number, number][] = [];
    const districtCounts: Record<string, number> = {};

    snapshot.forEach((doc) => {
      const data = doc.data();
      const district = extractDistrict(data.location);
      const lat = data.location?.lat;
      const lng = data.location?.lng;
      const precision = data.locationPrecision || "district";

      if (!district) return;

      // Count for district centroids
      districtCounts[district] = (districtCounts[district] || 0) + 1;

      // If we have exact coordinates (user-picked location), use them directly
      if (lat != null && lng != null) {
        // Higher precision = higher intensity weight
        const intensity = precision === "exact" ? 1.0 : precision === "street" ? 0.7 : 0.4;
        points.push([lat, lng, intensity]);
      }
    });

    // Add district centroids for districts without exact coordinates
    // These get lower intensity to distinguish from exact pins
    for (const [district, count] of Object.entries(districtCounts)) {
      const centroid = DISTRICT_CENTROIDS[district];
      if (centroid) {
        // Check if we already have points near this centroid
        const nearbyExact = points.filter(
          ([lat, lng]) =>
            Math.abs(lat - centroid.lat) < 0.1 && Math.abs(lng - centroid.lng) < 0.1
        ).length;

        // Only add centroid if no nearby exact pins
        if (nearbyExact === 0) {
          // Intensity based on count, capped at 0.6
          const intensity = Math.min(0.6, count * 0.1);
          points.push([centroid.lat, centroid.lng, intensity]);
        }
      }
    }

    // Build district centroid data for labeled markers
    const districtCentroids = Object.entries(districtCounts)
      .filter(([name]) => DISTRICT_CENTROIDS[name])
      .map(([name, count]) => ({
        name,
        lat: DISTRICT_CENTROIDS[name].lat,
        lng: DISTRICT_CENTROIDS[name].lng,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600");
    return res.status(200).json({
      points,
      districtCentroids,
      totalPins: points.length,
    });
  } catch (err) {
    console.error("Heatmap API error:", err);
    return res.status(500).json({ error: "হিটম্যাপ ডাটা লোড করা যায়নি।" });
  }
}