import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import TrendChart from "../components/TrendChart";
import TypePieChart from "../components/TypePieChart";
import DistrictBarChart from "../components/DistrictBarChart";
import { StatCardSkeleton } from "../components/Skeleton";

// Leaflet touches window, so load heatmap only client-side
const HeatMapView = dynamic(() => import("../components/HeatMapView"), {
  ssr: false,
  loading: () => (
    <div className="rounded-md border border-border bg-elevated/60 h-[520px] flex items-center justify-center">
      <p className="font-terminal text-sm text-text-muted animate-pulse">$ loading heatmap...</p>
    </div>
  ),
});

interface StatsData {
  total: number;
  pending: number;
  reviewing: number;
  published: number;
  rejected: number;
  incidents: number;
  grievances: number;
  topDistricts: { name: string; count: number }[];
}

interface TrendsData {
  monthly: { month: string; total: number; incidents: number; grievances: number }[];
  districtData: { name: string; total: number; incidents: number; grievances: number }[];
  statusDistribution: { name: string; value: number; color: string }[];
  summary: { total: number; pending: number; reviewing: number; published: number; rejected: number };
}

type Tab = "heatmap" | "trends" | "districts";

export default function Stats() {
  const [data, setData] = useState<StatsData | null>(null);
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("heatmap");

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setTrendsLoading(true);
    fetch("/api/stats/trends")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setTrendsData(d);
      })
      .catch(() => {})
      .finally(() => setTrendsLoading(false));
  }, []);

  const maxDistrictCount = data
    ? Math.max(...data.topDistricts.map((d) => d.count), 1)
    : 1;

  const tabs: { key: Tab; label: string }[] = [
    { key: "heatmap", label: "হিটম্যাপ" },
    { key: "trends", label: "ট্রেন্ড" },
    { key: "districts", label: "জেলা" },
  ];

  return (
    <>
      <Head>
        <title>পরিসংখ্যান — Nirbhoy</title>
        <meta name="description" content="Nirbhoy প্ল্যাটফর্মের সার্বিক পরিসংখ্যান — মোট রিপোর্ট, যাচাইয়ের অবস্থা, জেলা অনুযায়ী রিপোর্ট এবং আরও অনেক কিছু।" />
      </Head>
      <SiteHeader />

      <section className="mx-auto max-w-4xl px-6 py-14">
        <div className="flex items-center gap-3">
          <span className="font-terminal text-sm text-accent">$</span>
          <h1 className="font-display text-3xl font-semibold text-text-primary">পরিসংখ্যান</h1>
        </div>
        <p className="mt-3 font-code text-sm leading-relaxed text-text-muted">
          Nirbhoy প্ল্যাটফর্মের সার্বিক অবস্থা — মোট রিপোর্ট, যাচাইয়ের অবস্থা ও জেলা অনুযায়ী রিপোর্টের সংখ্যা।
          এই পরিসংখ্যান প্ল্যাটফর্মের স্বচ্ছতা ও বিশ্বাসযোগ্যতা বাড়াতে সাহায্য করে।
        </p>

        {error && (
          <div className="mt-8 rounded-md border border-danger/40 bg-danger-soft px-4 py-3">
            <p className="font-code text-sm text-danger">
              <span className="term-err">[!]</span> {error}
            </p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : data ? (
            <>
              <SummaryCard label="মোট রিপোর্ট" value={data.total} accent />
              <SummaryCard label="যাচাই চলছে" value={data.pending + data.reviewing} />
              <SummaryCard label="প্রকাশিত" value={data.published} />
              <SummaryCard label="প্রত্যাখ্যাত" value={data.rejected} />
            </>
          ) : null}
        </div>

        {/* Type + Status breakdown (always visible) */}
        {data && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <p className="font-terminal text-xs text-text-faint tracking-wider mb-4">$ রিপোর্টের ধরন</p>
              <TypePieChart incidents={data.incidents} grievances={data.grievances} />
            </div>
            <div className="card">
              <p className="font-terminal text-xs text-text-faint tracking-wider">$ যাচাইয়ের অবস্থা</p>
              <div className="mt-4 space-y-2">
                <StatusRow label="অপেক্ষমান" value={data.pending} total={data.total} color="bg-text-faint" />
                <StatusRow label="পর্যালোচনায়" value={data.reviewing} total={data.total} color="bg-accent" />
                <StatusRow label="প্রকাশিত" value={data.published} total={data.total} color="bg-accent-bright" />
                <StatusRow label="প্রত্যাখ্যাত" value={data.rejected} total={data.total} color="bg-danger" />
              </div>
            </div>
          </div>
        )}

        {/* ── Tabs: Heatmap | Trends | Districts ──────────────────────── */}
        <div className="mt-12">
          <div className="flex gap-1 border-b border-border pb-px">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2.5 font-terminal text-sm transition-all duration-200 border-b-2 -mb-px ${
                  activeTab === key
                    ? "border-accent text-accent"
                    : "border-transparent text-text-muted hover:text-text-primary"
                }`}
              >
                $ {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="mt-6">
            {/* ── Heatmap Tab ──────────────────────────────────────────── */}
            {activeTab === "heatmap" && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="rounded-none border border-accent/30 bg-accent-soft/40 px-2 py-0.5 font-terminal text-[10px] text-accent">
                    LIVE
                  </span>
                  <p className="font-code text-xs text-text-muted">
                    বাংলাদেশের বিভিন্ন জেলায় জমা পড়া রিপোর্টের ঘনত্ব — উজ্জ্বল লাল এলাকা বেশি রিপোর্ট নির্দেশ করে।
                  </p>
                </div>
                <HeatMapView height={520} />
              </div>
            )}

            {/* ── Trends Tab ───────────────────────────────────────────── */}
            {activeTab === "trends" && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <p className="font-code text-xs text-text-muted">
                    সময়ের সাথে সাথে রিপোর্ট জমা পড়ার প্রবণতা — লাইন টগল করে নির্দিষ্ট ধরন দেখুন।
                  </p>
                </div>
                <div className="card">
                  <p className="font-terminal text-xs text-text-faint tracking-wider mb-4">$ সময় অনুযায়ী রিপোর্ট</p>
                  <TrendChart data={trendsData?.monthly || []} loading={trendsLoading} />
                </div>
              </div>
            )}

            {/* ── Districts Tab ────────────────────────────────────────── */}
            {activeTab === "districts" && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <p className="font-code text-xs text-text-muted">
                    জেলা অনুযায়ী রিপোর্টের তুলনা — হোভার করে ঘটনা ও অভিযোগের সংখ্যা দেখুন।
                  </p>
                </div>
              <div className="card !overflow-visible">
                <p className="font-terminal text-xs text-text-faint tracking-wider mb-4">$ শীর্ষ জেলা (সর্বোচ্চ রিপোর্ট)</p>
                <DistrictBarChart data={trendsData?.districtData || []} loading={trendsLoading} />
              </div>
              </div>
            )}
          </div>
        </div>

        {data && data.total === 0 && (
          <div className="mt-10 card text-center">
            <p className="font-code text-sm text-text-muted">
              <span className="term-info">$</span> এখনো কোনো রিপোর্ট জমা হয়নি।
            </p>
          </div>
        )}

        <div className="mt-10 text-center">
          <Link href="/feed" className="btn-secondary">
            $ ফিড দেখুন
          </Link>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function SummaryCard({ label, value, accent = false }) {
  return (
    <div className={`card text-center ${accent ? "border-accent/30 bg-accent-soft/20" : ""}`}>
      <p className="font-terminal text-xs text-text-faint tracking-wider">{label}</p>
      <p className={`mt-2 font-display text-3xl font-semibold ${accent ? "text-accent" : "text-text-primary"}`}>
        {value}
      </p>
    </div>
  );
}

function StatusRow({ label, value, total, color }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="font-code text-xs text-text-muted w-24">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-elevated2 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-terminal text-xs text-text-muted min-w-[3ch] text-right">{value}</span>
    </div>
  );
}