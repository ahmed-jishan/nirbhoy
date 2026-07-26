import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { SkeletonFeed } from "../components/Skeleton";


// Leaflet touches `window`, so render the map view only on the client.
const MapView = dynamic(() => import("../components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="rounded-md border border-border bg-elevated/60 h-[520px] flex items-center justify-center">
      <p className="font-terminal text-sm text-text-muted animate-pulse">$ loading map...</p>
    </div>
  ),
});

// The 3D modal is imported lazily so MapLibre only ships to browsers that
// actually open the 3D view. Keeps the primary 2D flow untouched.
const Map3DModal = dynamic(() => import("../components/Map3DModal"), {
  ssr: false,
});


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

// Numeric ordering so we can sort/priority-render exact pins first.
const PRECISION_ORDER: Record<string, number> = {
  exact: 0,
  street: 1,
  thana: 2,
  district: 3,
};

// Attempts to guess the district from the human-readable location string.
// Returns null if nothing matches — we surface only detected districts in
// the filter dropdown so it stays clean.
function extractDistrict(location: string, knownDistricts: Set<string>): string | null {
  if (!location) return null;
  for (const d of knownDistricts) {
    if (location.includes(d)) return d;
  }
  return null;
}

export default function Feed() {
  const [items, setItems] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [districtFilter, setDistrictFilter] = useState<string>("all");
  const [precisionFilter, setPrecisionFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  // Which case is currently opened in the 3D modal (null = closed).
  const [threeDCase, setThreeDCase] = useState<any | null>(null);


  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setActiveCaseId(null);

    // Fetch with automatic retry — a single transient failure (serverless
    // cold start, brief network blip) shouldn't surface as an offline error.
    // We retry up to 2 times with a short backoff before giving up.
    async function loadComplaints(attempt = 0) {
      try {
        const res = await fetch(`/api/complaints?type=${typeFilter}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (!cancelled) {
          setItems(data.items || []);
          setLoading(false);
        }
      } catch (e) {
        if (cancelled) return;
        if (attempt < 2) {
          // Exponential-ish backoff: 600ms, then 1200ms.
          setTimeout(() => loadComplaints(attempt + 1), 600 * (attempt + 1));
          return;
        }
        setError(e instanceof Error ? e.message : "লোড করতে সমস্যা হয়েছে");
        setLoading(false);
      }
    }

    loadComplaints();

    return () => {
      cancelled = true;
    };
  }, [typeFilter]);

  // Build the list of districts that actually appear in the fetched items.
  // We only offer filters the user can act on — no empty dropdown options.
  const districtOptions = useMemo(() => {
    // Static list of known Bengali district names — mirrors the submit form.
    const known = new Set<string>([
      "ঢাকা", "চট্টগ্রাম", "খুলনা", "রাজশাহী", "সিলেট", "বরিশাল", "রংপুর", "ময়মনসিংহ",
      "কুমিল্লা", "নারায়ণগঞ্জ", "গাজীপুর", "বগুড়া", "যশোর", "কক্সবাজার", "দিনাজপুর",
      "পাবনা", "টাঙ্গাইল", "নোয়াখালী", "ফেনী", "ব্রাহ্মণবাড়িয়া", "সিরাজগঞ্জ", "নাটোর",
      "কুষ্টিয়া", "মাদারীপুর", "ফরিদপুর", "লক্ষ্মীপুর", "চাঁদপুর", "হবিগঞ্জ", "মৌলভীবাজার",
      "সুনামগঞ্জ", "নেত্রকোনা", "কিশোরগঞ্জ", "মানিকগঞ্জ", "জামালপুর", "শেরপুর", "গোপালগঞ্জ",
      "পটুয়াখালী", "ভোলা", "পিরোজপুর", "বরগুনা", "ঝালকাঠি", "সাতক্ষীরা", "মাগুরা",
      "নড়াইল", "চুয়াডাঙ্গা", "মেহেরপুর", "ঝিনাইদহ", "রাজবাড়ী", "শরীয়তপুর", "মুন্সিগঞ্জ",
      "নরসিংদী", "বান্দরবান", "রাঙ্গামাটি", "খাগড়াছড়ি", "লালমনিরহাট", "কুড়িগ্রাম",
      "গাইবান্ধা", "নীলফামারী", "পঞ্চগড়", "ঠাকুরগাঁও", "জয়পুরহাট", "নওগাঁ",
    ]);
    const found = new Set<string>();
    items.forEach((it) => {
      const d = extractDistrict(it.location || "", known);
      if (d) found.add(d);
    });
    return Array.from(found).sort();
  }, [items]);

  // Filter items by district + precision + search, then sort so exact pins bubble up.
  const filteredItems = useMemo(() => {
    const known = new Set(districtOptions);
    const q = searchQuery.toLowerCase().trim();
    return items
      .filter((it) => {
        if (districtFilter !== "all") {
          const d = extractDistrict(it.location || "", known);
          if (d !== districtFilter) return false;
        }
        if (precisionFilter !== "all") {
          const p = it.locationPrecision || "district";
          if (p !== precisionFilter) return false;
        }
        if (q) {
          const title = (it.title || "").toLowerCase();
          const summary = (it.summary || "").toLowerCase();
          const location = (it.location || "").toLowerCase();
          const caseId = (it.caseId || "").toLowerCase();
          if (!title.includes(q) && !summary.includes(q) && !location.includes(q) && !caseId.includes(q)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        // Exact-precision reports first, then by publish date.
        const pa = PRECISION_ORDER[a.locationPrecision || "district"] ?? 3;
        const pb = PRECISION_ORDER[b.locationPrecision || "district"] ?? 3;
        if (pa !== pb) return pa - pb;
        return (b.publishedAt || "").localeCompare(a.publishedAt || "");
      });
  }, [items, districtFilter, precisionFilter, districtOptions]);

  const mapItems = filteredItems.filter((item) => item.lat && item.lng);
  const exactCount = mapItems.filter((i) => i.locationPrecision === "exact").length;

  return (
    <>
      <Head><title>জনসাধারণের ফিড — Nirbhoy</title></Head>
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex items-center gap-3">
          <span className="font-terminal text-sm text-text-muted">$</span>
          <h1 className="font-display text-3xl font-semibold text-text-primary">জনসাধারণের ফিড</h1>
        </div>
        <p className="mt-3 max-w-lg font-code text-sm leading-relaxed text-text-muted">
          এখানে শুধু যাচাইকৃত ও মডারেট করা সারাংশ দেখানো হয় — কোনো ব্যক্তির নাম কখনোই দেখানো হয় না।
        </p>

        {/* Search */}
        <div className="mt-6">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-terminal text-xs text-text-faint pointer-events-none">$</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="শিরোনাম, কেস নম্বর, বা লোকেশন অনুসারে খুঁজুন..."
              className="w-full rounded-md border border-borderStrong bg-bg/80 pl-8 pr-4 py-2.5 font-code text-sm text-text-primary placeholder:text-text-faint focus:border-accent/50 focus:outline-none focus:shadow-[0_0_8px_rgba(13,148,136,0.06)] transition-all duration-200"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-primary transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filters + view toggle */}
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Type filter */}
            <div className="flex gap-1">
              {["all", "incident", "grievance"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 font-terminal text-xs font-medium tracking-wider transition-all duration-200 ${
                    typeFilter === t
                      ? "bg-bg text-text-primary border border-borderStrong shadow-sm"
                      : "text-text-muted hover:text-text-primary border border-transparent"
                  }`}
                >
                  {t === "all" ? "$ সব" : `$ ${TYPE_LABEL[t]}`}
                </button>
              ))}
            </div>

            {/* District filter */}
            {districtOptions.length > 0 && (
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="rounded-none border border-borderStrong bg-elevated px-3 py-1.5 font-terminal text-xs text-text-primary focus:border-accent/60 focus:outline-none"
              >
                <option value="all">$ সব জেলা</option>
                {districtOptions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}

            {/* Precision filter */}
            <select
              value={precisionFilter}
              onChange={(e) => setPrecisionFilter(e.target.value)}
              className="rounded-none border border-borderStrong bg-elevated px-3 py-1.5 font-terminal text-xs text-text-primary focus:border-accent/60 focus:outline-none"
              title="নির্ভুলতার স্তর"
            >
              <option value="all">$ যেকোনো স্তর</option>
              <option value="exact">সঠিক অবস্থান</option>
              <option value="street">রাস্তা স্তর</option>
              <option value="thana">থানা স্তর</option>
              <option value="district">জেলা স্তর</option>
            </select>

            {(districtFilter !== "all" || precisionFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setDistrictFilter("all");
                  setPrecisionFilter("all");
                }}
                className="rounded-none border border-border px-2.5 py-1.5 font-terminal text-xs text-text-faint hover:text-danger hover:border-danger/40 transition-colors"
              >
                ✕ ফিল্টার
              </button>
            )}
          </div>

          <div className="flex gap-1 rounded-none border border-border p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-none px-3 py-1.5 font-terminal text-xs transition-colors ${
                viewMode === "list" ? "bg-accent text-bg" : "text-text-muted hover:text-text-primary"
              }`}
            >
              তালিকা
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`rounded-none px-3 py-1.5 font-terminal text-xs transition-colors ${
                viewMode === "map" ? "bg-accent text-bg" : "text-text-muted hover:text-text-primary"
              }`}
            >
              মানচিত্র
            </button>
          </div>
        </div>

        {viewMode === "map" && (
          <div className="mt-6">
            {loading ? (
              <div className="rounded-md border border-border bg-elevated/60 h-[520px] flex items-center justify-center">
                <p className="font-terminal text-sm text-text-muted animate-pulse">$ loading map...</p>
              </div>
            ) : mapItems.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                <MapView
                  items={mapItems}
                  activeCaseId={activeCaseId}
                  onCaseSelect={setActiveCaseId}
                  height={560}
                />
                {/* Side list — exact-precision cases float to the top */}
                <div className="max-h-[560px] overflow-y-auto space-y-2 rounded-md border border-border bg-elevated/60 p-3">
                  <div className="sticky top-0 -mx-3 -mt-3 px-3 pt-3 pb-2 bg-elevated/95 backdrop-blur-sm border-b border-border">
                    <p className="font-terminal text-xs text-text-faint">
                      $ লোকেশন সহ রিপোর্ট ({mapItems.length}টি)
                    </p>
                    {exactCount > 0 && (
                      <p className="mt-1 font-terminal text-[10px] text-accent">
                        ⚡ {exactCount}টি সঠিক অবস্থান
                      </p>
                    )}
                  </div>
                  {mapItems.map((item) => (
                    <div
                      key={item.id}
                      className={`w-full rounded-md border p-3 transition-colors ${
                        activeCaseId === item.caseId
                          ? "border-accent/60 bg-accent-soft/40"
                          : item.locationPrecision === "exact"
                          ? "border-accent/20 bg-elevated hover:border-accent/40"
                          : "border-border bg-elevated hover:border-accent/30"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveCaseId(item.caseId)}
                        className="w-full text-left"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-terminal text-xs text-accent">{item.caseId}</span>
                          <span
                            className={`font-terminal text-[10px] ${
                              item.locationPrecision === "exact"
                                ? "text-accent"
                                : "text-text-faint"
                            }`}
                          >
                            {item.locationPrecision === "exact" && "⚡ "}
                            {PRECISION_LABEL[item.locationPrecision || "district"] || "জেলা"}
                          </span>
                        </div>
                        <p className="mt-1 font-code text-xs text-text-primary line-clamp-2">
                          {item.title}
                        </p>
                        <p className="mt-0.5 font-terminal text-[10px] text-text-faint truncate">
                          {item.location ? item.location.split(",").slice(0, 2).join(", ") : ""}
                        </p>
                      </button>
                      {/* Only offer 3D view for high-precision pins — for
                          low-precision (thana/district) coordinates the
                          building geometry wouldn't match reality anyway. */}
                      {(item.locationPrecision === "exact" ||
                        item.locationPrecision === "street") && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setThreeDCase(item);
                          }}
                          className="mt-2 w-full rounded-md border border-accent/30 bg-accent-soft/30 px-2 py-1 font-terminal text-[10px] text-accent hover:bg-accent hover:text-bg transition-colors"
                          title="৩ডি মানচিত্রে দেখুন"
                        >
                          ⛰ ৩ডি ভিউ দেখুন
                        </button>
                      )}
                    </div>
                  ))}

                </div>
              </div>
            ) : (
              <div className="card text-center">
                <p className="font-code text-sm text-text-muted">
                  <span className="term-err">[!]</span> এই ফিল্টারে মানচিত্রে দেখানোর মতো কোনো রিপোর্ট নেই।
                </p>
              </div>
            )}
          </div>
        )}

        {viewMode === "list" && (
          <div className="mt-8 space-y-4">
            {loading && <SkeletonFeed count={5} />}
            {error && (
              <p className="rounded-none border border-danger/40 bg-danger-soft px-4 py-3 font-code text-sm text-danger">
                <span className="term-err">[!]</span> {error}
              </p>
            )}
            {!loading && !error && filteredItems.length === 0 && (
              <div className="card text-center">
                <p className="font-code text-sm text-text-muted">
                  <span className="term-info">$</span> {items.length === 0
                    ? "এখনো কোনো প্রকাশিত রিপোর্ট নেই।"
                    : "এই ফিল্টারে কোনো রিপোর্ট নেই।"}
                </p>
              </div>
            )}
            {filteredItems.map((item, idx) => (
              <article key={item.id} className="card" style={{ animationDelay: `${idx * 0.05}s` }}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-terminal text-xs tracking-widest text-text-primary">
                    {item.caseId}
                  </span>
                  <div className="flex items-center gap-2">
                    {item.locationPrecision === "exact" && (
                      <span className="rounded-none border border-accent/40 bg-accent-soft px-1.5 py-0.5 font-terminal text-[10px] text-accent">
                        ⚡ সঠিক
                      </span>
                    )}
                    <span className="badge-published">
                      {TYPE_LABEL[item.type] || item.type}
                    </span>
                  </div>
                </div>
                <Link href={`/case/${item.caseId}`} className="block group">
                  <h3 className="mt-3 font-display text-lg font-medium text-text-primary group-hover:text-accent transition-colors">
                    {item.title}
                  </h3>
                  {item.summary && (
                    <div className="mt-2">
                      <p className="font-code text-sm leading-relaxed text-text-muted line-clamp-2">
                        {item.summary}
                      </p>
                      {item.summary.length > 120 && (
                        <Link
                          href={`/case/${item.caseId}`}
                          className="mt-1 inline-flex items-center gap-1 font-terminal text-[11px] text-accent hover:text-accent-bright transition-colors"
                        >
                          আরও পড়ুন →
                        </Link>
                      )}
                    </div>
                  )}
                </Link>
                <div className="mt-4 flex items-center justify-between font-terminal text-xs text-text-faint">
                  <span>{'>'} {item.location || "স্থান উল্লেখ নেই"}</span>
                  <span>
                    {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("bn-BD") : ""}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-end">
                  <Link
                    href={`/case/${item.caseId}`}
                    className="font-terminal text-[11px] text-accent hover:underline"
                  >
                    টাইমলাইন দেখুন →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <p className="mt-8 text-center font-terminal text-xs text-text-faint">
            $ মোট {items.length}টি · ফিল্টারে {filteredItems.length}টি · মানচিত্রে {mapItems.length}টি
          </p>
        )}
      </section>

      {/* 3D view modal — mounts only when a case is selected so the
          MapLibre GL engine doesn't run unless the user opts in. */}
      {threeDCase && (
        <Map3DModal
          open={!!threeDCase}
          onClose={() => setThreeDCase(null)}
          lat={threeDCase.lat}
          lng={threeDCase.lng}
          caseId={threeDCase.caseId}
          title={threeDCase.title}
          type={threeDCase.type}
        />
      )}

      <SiteFooter />
    </>
  );
}