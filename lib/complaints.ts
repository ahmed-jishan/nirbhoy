import { adminDb } from "./firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { logger } from "./logger";

const COMPLAINTS = "complaints";
const COUNTERS = "counters";

export const STATUSES = ["pending", "reviewing", "published", "rejected"];
export const DEFAULT_PAGE_SIZE = 50;

// Atomically increments a per-year counter and returns a case ID like
// NRB-2026-00001. A transaction avoids two simultaneous submitters getting
// the same number.
async function generateCaseId() {
  const db = adminDb();
  const year = new Date().getFullYear();
  const counterRef = db.collection(COUNTERS).doc(`complaints_${year}`);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const next = (snap.exists ? snap.data().count : 0) + 1;
    tx.set(counterRef, { count: next }, { merge: true });
    return `NRB-${year}-${String(next).padStart(5, "0")}`;
  });
}

// Map of districts to approximate lat/lng for crime mapping
const BANGLADESH_LOCATIONS = {
  "ঢাকা": { lat: 23.8103, lng: 90.4125 },
  "চট্টগ্রাম": { lat: 22.3569, lng: 91.7832 },
  "খুলনা": { lat: 22.8456, lng: 89.5403 },
  "রাজশাহী": { lat: 24.3745, lng: 88.6042 },
  "সিলেট": { lat: 24.8949, lng: 91.8687 },
  "বরিশাল": { lat: 22.7010, lng: 90.3535 },
  "রংপুর": { lat: 25.7439, lng: 89.2752 },
  "ময়মনসিংহ": { lat: 24.7471, lng: 90.4203 },
  "কুমিল্লা": { lat: 23.4607, lng: 91.1809 },
  "নারায়ণগঞ্জ": { lat: 23.6213, lng: 90.4950 },
  "গাজীপুর": { lat: 23.9999, lng: 90.4203 },
  "বগুড়া": { lat: 24.8510, lng: 89.3697 },
  "যশোর": { lat: 23.1634, lng: 89.2112 },
  "কক্সবাজার": { lat: 21.4272, lng: 91.9820 },
  "দিনাজপুর": { lat: 25.6279, lng: 88.6333 },
  "পাবনা": { lat: 24.0064, lng: 89.2456 },
  "টাঙ্গাইল": { lat: 24.2476, lng: 89.9203 },
  "নোয়াখালী": { lat: 22.8696, lng: 91.0161 },
  "ফেনী": { lat: 23.0133, lng: 91.3967 },
  "ব্রাহ্মণবাড়িয়া": { lat: 23.9608, lng: 91.1115 },
  "সিরাজগঞ্জ": { lat: 24.4533, lng: 89.7024 },
  "নাটোর": { lat: 24.4125, lng: 89.0022 },
  "কুষ্টিয়া": { lat: 23.9014, lng: 89.1214 },
  "মাদারীপুর": { lat: 23.1628, lng: 90.1875 },
  "ফরিদপুর": { lat: 23.6042, lng: 89.8420 },
  "লক্ষ্মীপুর": { lat: 22.9447, lng: 90.8289 },
  "চাঁদপুর": { lat: 23.2331, lng: 90.6615 },
  "হবিগঞ্জ": { lat: 24.3733, lng: 91.4147 },
  "মৌলভীবাজার": { lat: 24.4813, lng: 91.7667 },
  "সুনামগঞ্জ": { lat: 25.0647, lng: 91.3997 },
  "নেত্রকোনা": { lat: 24.8825, lng: 90.7293 },
  "কিশোরগঞ্জ": { lat: 24.4269, lng: 90.5794 },
  "মানিকগঞ্জ": { lat: 23.8517, lng: 90.0046 },
  "জামালপুর": { lat: 24.9230, lng: 89.9386 },
  "শেরপুর": { lat: 25.0201, lng: 90.0186 },
  "গোপালগঞ্জ": { lat: 23.0055, lng: 89.8272 },
  "পটুয়াখালী": { lat: 22.3531, lng: 90.3241 },
  "ভোলা": { lat: 22.6871, lng: 90.6507 },
  "পিরোজপুর": { lat: 22.5819, lng: 89.9875 },
  "বরগুনা": { lat: 22.1527, lng: 90.1278 },
  "ঝালকাঠি": { lat: 22.6427, lng: 90.2011 },
  "সাতক্ষীরা": { lat: 22.3165, lng: 89.0707 },
  "মাগুরা": { lat: 23.4855, lng: 89.4160 },
  "নড়াইল": { lat: 23.1635, lng: 89.4960 },
  "চুয়াডাঙ্গা": { lat: 23.6453, lng: 88.8495 },
  "মেহেরপুর": { lat: 23.7799, lng: 88.6363 },
  "ঝিনাইদহ": { lat: 23.5428, lng: 89.1808 },
  "রাজবাড়ী": { lat: 23.7555, lng: 89.6473 },
  "শরীয়তপুর": { lat: 23.2975, lng: 90.3461 },
  "মুন্সিগঞ্জ": { lat: 23.5438, lng: 90.5358 },
  "নরসিংদী": { lat: 23.9249, lng: 90.7170 },
  "বান্দরবান": { lat: 22.1953, lng: 92.2184 },
  "রাঙ্গামাটি": { lat: 22.6498, lng: 92.2018 },
  "খাগড়াছড়ি": { lat: 23.0393, lng: 91.9942 },
  "লালমনিরহাট": { lat: 25.9240, lng: 89.4450 },
  "কুড়িগ্রাম": { lat: 25.8070, lng: 89.6282 },
  "গাইবান্ধা": { lat: 25.3252, lng: 89.5405 },
  "নীলফামারী": { lat: 25.9410, lng: 88.8610 },
  "পঞ্চগড়": { lat: 26.3345, lng: 88.5577 },
  "ঠাকুরগাঁও": { lat: 26.0317, lng: 88.4608 },
  "জয়পুরহাট": { lat: 25.1040, lng: 89.0250 },
  "নওগাঁ": { lat: 24.8042, lng: 88.9508 },
};

// Thana-level coordinates for more precise map display
const THANA_LOCATIONS = {
  // Dhaka district thanas
  "সদর": { lat: 23.7104, lng: 90.4074 },
  "কোতোয়ালী": { lat: 23.7099, lng: 90.4122 },
  "যাত্রাবাড়ী": { lat: 23.7085, lng: 90.4300 },
  "ডেমরা": { lat: 23.7200, lng: 90.4800 },
  "গুলশান": { lat: 23.7925, lng: 90.4150 },
  "মিরপুর": { lat: 23.8000, lng: 90.3650 },
  "উত্তরা": { lat: 23.8750, lng: 90.4000 },
  "মোহাম্মদপুর": { lat: 23.7600, lng: 90.3600 },
  "ধানমন্ডি": { lat: 23.7450, lng: 90.3750 },
  "তেজগাঁও": { lat: 23.7650, lng: 90.3900 },
  "আদর্শ": { lat: 23.7000, lng: 90.4200 },
  "কেরানীগঞ্জ": { lat: 23.6800, lng: 90.3600 },
  "নবাবগঞ্জ": { lat: 23.6500, lng: 90.3200 },
  "দোহার": { lat: 23.5900, lng: 90.3000 },
  "সাভার": { lat: 23.8583, lng: 90.2667 },
  "ধামরাই": { lat: 23.9100, lng: 90.2200 },
  // Narayanganj
  "বন্দর": { lat: 23.6100, lng: 90.5200 },
  "রূপগঞ্জ": { lat: 23.7800, lng: 90.5200 },
  "সোনারগাঁও": { lat: 23.6500, lng: 90.6000 },
  "ফতুল্লা": { lat: 23.6400, lng: 90.4800 },
  "সিদ্ধিরগঞ্জ": { lat: 23.6800, lng: 90.5000 },
  "আড়াইহাজার": { lat: 23.7900, lng: 90.6500 },
  // Gazipur
  "কালিয়াকৈর": { lat: 24.0800, lng: 90.2200 },
  "কালীগঞ্জ": { lat: 24.1000, lng: 90.1800 },
  "কাপাসিয়া": { lat: 24.1000, lng: 90.5500 },
  "শ্রীপুর": { lat: 24.2000, lng: 90.4700 },
  // Chittagong thanas
  "পাঁচলাইশ": { lat: 22.3400, lng: 91.8200 },
  "চন্দনাইশ": { lat: 22.2000, lng: 91.9800 },
  "বাঁশখালী": { lat: 22.3000, lng: 91.9500 },
  "পটিয়া": { lat: 22.2900, lng: 91.9800 },
  "রাঙ্গুনিয়া": { lat: 22.4600, lng: 91.9300 },
  "হাটহাজারী": { lat: 22.5000, lng: 91.8000 },
  "ফটিকছড়ি": { lat: 22.6800, lng: 91.7800 },
  "রাউজান": { lat: 22.5300, lng: 91.9200 },
  "সাতকানিয়া": { lat: 22.1000, lng: 92.0500 },
  "বোয়ালখালী": { lat: 22.3700, lng: 91.9200 },
  "আনোয়ারা": { lat: 22.2100, lng: 91.9000 },
  "মিরসরাই": { lat: 22.7700, lng: 91.5700 },
  "লোহাগাড়া": { lat: 22.0000, lng: 92.1000 },
  "সন্দ্বীপ": { lat: 22.4800, lng: 91.4300 },
  "সীতাকুণ্ড": { lat: 22.6100, lng: 91.6600 },
  "কর্ণফুলী": { lat: 22.3200, lng: 91.8000 },
  // Cox's Bazar
  "চকরিয়া": { lat: 21.7800, lng: 92.0000 },
  "টেকনাফ": { lat: 20.8700, lng: 92.3000 },
  "উখিয়া": { lat: 21.2800, lng: 92.1000 },
  "কুতুবদিয়া": { lat: 21.8200, lng: 91.8600 },
  "পেকুয়া": { lat: 21.8200, lng: 92.0000 },
  "মহেশখালী": { lat: 21.5500, lng: 91.9500 },
  "রামু": { lat: 21.4500, lng: 92.1000 },
  // Sylhet
  "বালাগঞ্জ": { lat: 24.6700, lng: 91.8300 },
  "বিয়ানীবাজার": { lat: 24.8200, lng: 92.1500 },
  "বিশ্বনাথ": { lat: 24.8200, lng: 91.7200 },
  "কানাইঘাট": { lat: 25.0200, lng: 92.2500 },
  "জকিগঞ্জ": { lat: 24.8700, lng: 92.3700 },
  "গোলাপগঞ্জ": { lat: 24.8500, lng: 91.7800 },
  "ফেঞ্চুগঞ্জ": { lat: 24.7000, lng: 91.9400 },
  "কোম্পানীগঞ্জ": { lat: 25.0800, lng: 91.8000 },
  "গোয়াইনঘাট": { lat: 25.1000, lng: 91.9000 },
  "জৈন্তাপুর": { lat: 25.1200, lng: 92.1200 },
  "ওসমানীনগর": { lat: 24.7300, lng: 91.7500 },
  "দক্ষিণ সুরমা": { lat: 24.9000, lng: 91.8700 },
  // Rajshahi
  "বোয়ালিয়া": { lat: 24.3700, lng: 88.6000 },
  "মতিহার": { lat: 24.3800, lng: 88.6200 },
  "শাহমখদুম": { lat: 24.4000, lng: 88.5800 },
  "চারঘাট": { lat: 24.2800, lng: 88.5000 },
  "পবা": { lat: 24.4200, lng: 88.5500 },
  "বাঘা": { lat: 24.2000, lng: 88.8400 },
  "গোদাগাড়ী": { lat: 24.4600, lng: 88.3300 },
  "তানোড়": { lat: 24.6000, lng: 88.5800 },
  "দুর্গাপুর": { lat: 24.4500, lng: 88.7700 },
  "পুঠিয়া": { lat: 24.3600, lng: 88.8300 },
  "বাগমারা": { lat: 24.5600, lng: 88.5600 },
  "মোহনপুর": { lat: 24.5600, lng: 88.6500 },
  // Khulna
  "দৌলতপুর": { lat: 22.8800, lng: 89.5200 },
  "খালিশপুর": { lat: 22.9000, lng: 89.5000 },
  "সোনাডাঙ্গা": { lat: 22.8100, lng: 89.5600 },
  "হরিণটানা": { lat: 22.8200, lng: 89.5300 },
  "পাইকগাছা": { lat: 22.5800, lng: 89.3300 },
  "বটিয়াঘাটা": { lat: 22.7200, lng: 89.5200 },
  "ডুমুরিয়া": { lat: 22.8000, lng: 89.4200 },
  "কয়রা": { lat: 22.3500, lng: 89.3000 },
  "দাকোপ": { lat: 22.5700, lng: 89.5100 },
  "তেরখাদা": { lat: 22.9400, lng: 89.6700 },
  "ফুলতলা": { lat: 22.9700, lng: 89.4700 },
  "রূপসা": { lat: 22.8300, lng: 89.5800 },
  "দিঘলিয়া": { lat: 22.9200, lng: 89.5300 },
  // Barisal
  "আগৈলঝাড়া": { lat: 22.9600, lng: 90.1400 },
  "বাকেরগঞ্জ": { lat: 22.5500, lng: 90.3300 },
  "বানারীপাড়া": { lat: 22.7800, lng: 90.1700 },
  "গৌরনদী": { lat: 22.9700, lng: 90.2200 },
  "হিজলা": { lat: 23.0000, lng: 90.5000 },
  "মেহেন্দিগঞ্জ": { lat: 22.8200, lng: 90.5300 },
  "মুলাদী": { lat: 22.9100, lng: 90.4000 },
  "বাবুগঞ্জ": { lat: 22.6800, lng: 90.3200 },
  "উজিরপুর": { lat: 22.8100, lng: 90.2400 },
  // Rangpur
  "পীরগঞ্জ": { lat: 25.8500, lng: 89.3200 },
  "বদরগঞ্জ": { lat: 25.6700, lng: 89.0500 },
  "গংগাচড়া": { lat: 25.8500, lng: 89.2200 },
  "তারাগঞ্জ": { lat: 25.8000, lng: 89.0200 },
  "কাউনিয়া": { lat: 25.7700, lng: 89.4200 },
  "মিঠাপুকুর": { lat: 25.5700, lng: 89.2800 },
  "পীরগাছা": { lat: 25.7000, lng: 89.4000 },
  // Mymensingh
  "ঈশ্বরগঞ্জ": { lat: 24.6800, lng: 90.5900 },
  "গফরগাঁও": { lat: 24.4200, lng: 90.5500 },
  "গৌরীপুর": { lat: 24.7500, lng: 90.5700 },
  "ত্রিশাল": { lat: 24.5800, lng: 90.3800 },
  "ধোবাউড়া": { lat: 25.1000, lng: 90.1200 },
  "নান্দাইল": { lat: 24.5600, lng: 90.6800 },
  "ফুলবাড়িয়া": { lat: 24.6300, lng: 90.2700 },
  "ফুলপুর": { lat: 25.0300, lng: 90.3600 },
  "ভালুকা": { lat: 24.3700, lng: 90.3800 },
  "মুক্তাগাছা": { lat: 24.7600, lng: 90.2600 },
  "হালুয়াঘাট": { lat: 25.1200, lng: 90.3500 },
};

// Simple in-memory cache for Nominatim geocoding results
const geocodeCache = new Map();

/**
 * Geocode a location string using Nominatim (OpenStreetMap free API)
 * Returns { lat, lng } or null if not found
 * Rate-limited to 1 request per second (Nominatim TOS)
 */
async function geocodeWithNominatim(query) {
  if (!query || query.trim().length < 5) return null;

  const cacheKey = query.trim().toLowerCase();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=bd`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Nirbhoy/1.0 (complaint geocoding)' },
    });
    const data = await res.json();
    if (data && data.length > 0) {
      const result = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
      geocodeCache.set(cacheKey, result);
      return result;
    }
    geocodeCache.set(cacheKey, null);
    return null;
  } catch {
    return null;
  }
}

function getLocationFromDistrict(districtName) {
  if (!districtName) return null;
  // Try exact match
  if (BANGLADESH_LOCATIONS[districtName]) return BANGLADESH_LOCATIONS[districtName];
  // Try fuzzy match
  for (const [key, coords] of Object.entries(BANGLADESH_LOCATIONS)) {
    if (districtName.includes(key) || key.includes(districtName)) {
      return coords;
    }
  }
  return null;
}

export async function createComplaint(input) {
  const db = adminDb();
  const caseId = await generateCaseId();

  // Handle structured or plain-text location
  let location = "";
  let lat = null;
  let lng = null;
  let locationPrecision = "district";

  if (typeof input.location === "object" && input.location !== null) {
    const loc = input.location;
    // Build a human-readable location string from structured data
    const parts = [];
    if (loc.detail) parts.push(loc.detail);
    if (loc.city) parts.push(loc.city);
    if (loc.thana) parts.push(loc.thana);
    if (loc.district) parts.push(loc.district);
    if (loc.division) parts.push(loc.division);
    if (loc.postOffice) parts.push(loc.postOffice);
    if (loc.postalCode) parts.push(loc.postalCode);
    location = parts.join(", ");

    // Step 1: Try Nominatim for exact street-level geocoding if detail provided
    if (loc.detail && loc.detail.trim().length > 3) {
      const nominatimQuery = [loc.detail, loc.thana, loc.district, "Bangladesh"]
        .filter(Boolean)
        .join(", ");
      const exactCoords = await geocodeWithNominatim(nominatimQuery);
      if (exactCoords) {
        lat = exactCoords.lat;
        lng = exactCoords.lng;
        locationPrecision = "street";
      }
    }

    // Step 2: If Nominatim failed or no detail, fall back to thana/district
    if (lat === null) {
      if (loc.thana && THANA_LOCATIONS[loc.thana]) {
        const thanaCoords = THANA_LOCATIONS[loc.thana];
        lat = thanaCoords.lat;
        lng = thanaCoords.lng;
        locationPrecision = "thana";
      } else {
        const coords = getLocationFromDistrict(loc.district);
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
        }
      }
    }
  } else if (typeof input.location === "string") {
    location = input.location;
    // Try Nominatim for free-text location
    const exactCoords = await geocodeWithNominatim(location + ", Bangladesh");
    if (exactCoords) {
      lat = exactCoords.lat;
      lng = exactCoords.lng;
      locationPrecision = "street";
    }
    // Fallback to district matching
    if (lat === null) {
      for (const [district, coords] of Object.entries(BANGLADESH_LOCATIONS)) {
        if (location.includes(district)) {
          lat = coords.lat;
          lng = coords.lng;
          break;
        }
      }
    }
  }

  const doc = {
    caseId,
    type: input.type,
    title: input.title,
    description: input.description,
    location,
    lat,
    lng,
    locationPrecision,
    proofs: input.proofs || [],
    status: "pending",
    publicTitle: null,
    publicSummary: null,
    rejectionReason: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    publishedAt: null,
  };

  const ref = await db.collection(COMPLAINTS).add(doc);
  return { id: ref.id, caseId };
}

export async function getComplaintStatusByCaseId(caseId) {
  const db = adminDb();
  const snap = await db.collection(COMPLAINTS).where("caseId", "==", caseId).limit(1).get();
  if (snap.empty) return null;
  const d = snap.docs[0].data();
  return {
    caseId: d.caseId,
    status: d.status,
    updatedAt: d.updatedAt ? d.updatedAt.toDate().toISOString() : null,
  };
}

export async function listPublishedComplaints({ type = null, pageSize = 200 } = {}) {
  const db = adminDb();
  try {
    // Use simple query without orderBy to avoid needing composite index.
    // Sort in memory by publishedAt desc.
    let q = db.collection(COMPLAINTS).where("status", "==", "published");
    if (type) q = q.where("type", "==", type);
    const snap = await q.get();
    const items = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        caseId: d.caseId,
        type: d.type,
        title: d.publicTitle || d.title,
        summary: d.publicSummary || "",
        location: d.location || "",
        lat: d.lat || null,
        lng: d.lng || null,
        locationPrecision: d.locationPrecision || "district",
        publishedAt: d.publishedAt ? d.publishedAt.toDate().toISOString() : null,
      };
    })
    .sort((a, b) => {
      if (!a.publishedAt) return 1;
      if (!b.publishedAt) return -1;
      return b.publishedAt.localeCompare(a.publishedAt);
    })
    .slice(0, pageSize);
    return items;
  } catch (err) {
    logger.warn({ err: String(err.message || err) }, "listPublishedComplaints failed — returning empty");
    return [];
  }
}

/**
 * List complaints for admin with simple query + in-memory sort.
 * Avoids Firestore composite index requirement by NOT using orderBy with where.
 * For production at scale, create the composite index: status ASC, createdAt DESC
 */
export async function listComplaintsForAdmin({ status = null, limit = DEFAULT_PAGE_SIZE, startAfter = null } = {}) {
  const db = adminDb();
  const pageSize = Math.min(Math.max(1, limit), 300);

  try {
    // Simple query without orderBy — works without composite indexes
    let q = db.collection(COMPLAINTS).limit(pageSize + 1);
    
    if (status && status !== "all") q = q.where("status", "==", status);

    const snap = await q.get();
    const lastId = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1].id : null;

    // Sort in memory by createdAt desc
    const items = snap.docs
      .map((doc) => {
        const d = doc.data();
        return { 
          id: doc.id,
          caseId: d.caseId,
          type: d.type,
          title: d.title,
          status: d.status,
          location: d.location,
          hasProof: Array.isArray(d.proofs) ? d.proofs.length > 0 : Boolean(d.proofPublicId),
          proofCount: Array.isArray(d.proofs) ? d.proofs.length : (d.proofPublicId ? 1 : 0),
          createdAt: d.createdAt ? d.createdAt.toDate().toISOString() : null,
        };
      })
      .sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.localeCompare(a.createdAt);
      });
    
    // Handle startAfter pagination (in-memory after sorting)
    let filtered = items;
    if (startAfter) {
      const startIndex = items.findIndex((item) => item.id === startAfter);
      if (startIndex !== -1) {
        filtered = items.slice(startIndex + 1);
      }
    }

    const paged = filtered.slice(0, pageSize);
    const hasMore = filtered.length > pageSize;

    return { items: paged, hasMore, lastId: paged.length > 0 ? paged[paged.length - 1].id : null };
  } catch (err) {
    logger.error({ err: String(err.message || err), status }, "listComplaintsForAdmin failed");
    return { items: [], hasMore: false, lastId: null };
  }
}

export async function getComplaintById(id) {
  const db = adminDb();
  const doc = await db.collection(COMPLAINTS).doc(id).get();
  if (!doc.exists) return null;
  const d = doc.data();
  return {
    id: doc.id,
    caseId: d.caseId,
    type: d.type,
    title: d.title,
    description: d.description,
    location: d.location,
    proofs: d.proofs || (d.proofPublicId ? [{ publicId: d.proofPublicId, resourceType: d.proofResourceType || "image" }] : []),
    status: d.status,
    publicTitle: d.publicTitle,
    publicSummary: d.publicSummary,
    rejectionReason: d.rejectionReason,
    createdAt: d.createdAt ? d.createdAt.toDate().toISOString() : null,
    updatedAt: d.updatedAt ? d.updatedAt.toDate().toISOString() : null,
    publishedAt: d.publishedAt ? d.publishedAt.toDate().toISOString() : null,
  };
}

export async function updateComplaintStatus(id, { status, publicTitle, publicSummary, rejectionReason }) {
  const db = adminDb();
  const ref = db.collection(COMPLAINTS).doc(id);
  const update = {
    status,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (status === "published") {
    update.publicTitle = publicTitle || null;
    update.publicSummary = publicSummary || null;
    update.publishedAt = FieldValue.serverTimestamp();
    update.rejectionReason = null;
  } else if (status === "rejected") {
    update.rejectionReason = rejectionReason || null;
  }
  await ref.update(update);
  return getComplaintById(id);
}