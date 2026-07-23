import { listPublishedComplaints } from "../../../lib/complaints";
import { applySecurityHeaders } from "../../../lib/securityHeaders";
import { toCsvWithBom, type CsvRow } from "../../../lib/csv";
import { logger } from "../../../lib/logger";

/**
 * GET /api/export/csv
 *
 * Dynamic CSV generation for the public feed and the stats page. The dataset
 * is chosen with `?dataset=feed|stats` and further narrowed with the same
 * filter params the feed UI already uses, so a "download what I'm seeing"
 * button is trivial on the client.
 *
 * Query params
 *   dataset    "feed" (default) | "stats"
 *   type       "incident" | "grievance" | "all"          (feed only)
 *   district   Bengali district name to filter by         (feed only)
 *   precision  "exact" | "street" | "thana" | "district"  (feed only)
 *   q          free-text search over title/summary/location/caseId (feed only)
 *
 * Only *published*, already-moderated data is ever exported — no names, no
 * pending/rejected cases, no exact reporter coordinates beyond the rounded
 * grid the feed already exposes.
 */

const TYPE_LABEL: Record<string, string> = {
  incident: "অপরাধ / ঘটনা",
  grievance: "সাধারণ অভিযোগ",
};

const PRECISION_LABEL: Record<string, string> = {
  exact: "সঠিক",
  street: "রাস্তা",
  thana: "থানা",
  district: "জেলা",
};

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

function extractDistrict(location: string): string | null {
  if (!location) return null;
  for (const d of KNOWN_DISTRICTS) {
    if (location.includes(d)) return d;
  }
  return null;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/** Build the feed CSV from published complaints, honouring feed filters. */
async function buildFeedCsv(query: Record<string, any>) {
  const type = str(query.type);
  const district = str(query.district);
  const precision = str(query.precision);
  const q = str(query.q).toLowerCase().trim();

  const items = await listPublishedComplaints({
    type: type && type !== "all" ? type : null,
  });

  const filtered = items.filter((it: any) => {
    if (district && district !== "all") {
      if (extractDistrict(it.location || "") !== district) return false;
    }
    if (precision && precision !== "all") {
      if ((it.locationPrecision || "district") !== precision) return false;
    }
    if (q) {
      const hay = [it.title, it.summary, it.location, it.caseId]
        .map((v) => (v || "").toLowerCase())
        .join(" ");
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const headers = [
    "কেস নম্বর",
    "ধরন",
    "শিরোনাম",
    "সারাংশ",
    "স্থান",
    "নির্ভুলতা",
    "অক্ষাংশ",
    "দ্রাঘিমাংশ",
    "প্রকাশের তারিখ",
  ];

  const rows: CsvRow[] = filtered.map((it: any) => [
    it.caseId || "",
    TYPE_LABEL[it.type] || it.type || "",
    it.title || "",
    it.summary || "",
    it.location || "",
    PRECISION_LABEL[it.locationPrecision || "district"] || "জেলা",
    it.lat ?? "",
    it.lng ?? "",
    it.publishedAt ? new Date(it.publishedAt).toISOString() : "",
  ]);

  return { headers, rows, filename: "nirbhoy-feed" };
}

/** Build the stats CSV from the aggregate stats API's data. */
async function buildStatsCsv() {
  const { adminDb } = await import("../../../lib/firebaseAdmin");
  const db = adminDb();
  const snapshot = await db.collection("complaints").get();

  let pending = 0, reviewing = 0, published = 0, rejected = 0;
  let incidents = 0, grievances = 0;
  const districtCount: Record<string, number> = {};

  snapshot.forEach((doc: any) => {
    const data = doc.data();
    const status = data.status || "pending";
    const type = data.type || "grievance";
    const district = extractDistrict(str(data.location)) || "অজানা";

    if (status === "pending") pending++;
    else if (status === "reviewing") reviewing++;
    else if (status === "published") published++;
    else if (status === "rejected") rejected++;

    if (type === "incident") incidents++;
    else grievances++;

    districtCount[district] = (districtCount[district] || 0) + 1;
  });

  const total = snapshot.size;

  const headers = ["পরিমাপ", "মান"];
  const rows: CsvRow[] = [
    ["মোট রিপোর্ট", total],
    ["অপেক্ষমান", pending],
    ["পর্যালোচনায়", reviewing],
    ["প্রকাশিত", published],
    ["প্রত্যাখ্যাত", rejected],
    ["অপরাধ / ঘটনা", incidents],
    ["সাধারণ অভিযোগ", grievances],
  ];

  const sortedDistricts = Object.entries(districtCount).sort(([, a], [, b]) => b - a);
  if (sortedDistricts.length > 0) {
    rows.push(["", ""]);
    rows.push(["জেলা", "রিপোর্ট সংখ্যা"]);
    for (const [name, count] of sortedDistricts) {
      rows.push([name, count]);
    }
  }

  return { headers, rows, filename: "nirbhoy-stats" };
}

export default async function handler(req: any, res: any) {
  applySecurityHeaders(res);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const dataset = str(req.query.dataset) || "feed";

    const { headers, rows, filename } =
      dataset === "stats"
        ? await buildStatsCsv()
        : await buildFeedCsv(req.query);

    const csv = toCsvWithBom(headers, rows);
    const stamp = new Date().toISOString().slice(0, 10);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}-${stamp}.csv"`
    );
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(csv);
  } catch (err) {
    logger.error({ err }, "GET /api/export/csv failed");
    return res.status(500).json({ error: "CSV তৈরি করা যায়নি। আবার চেষ্টা করুন।" });
  }
}