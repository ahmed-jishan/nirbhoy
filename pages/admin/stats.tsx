import { useEffect, useState } from "react";
import Head from "next/head";
import AdminHeader from "../../components/AdminHeader";
import TrendChart from "../../components/TrendChart";
import TypePieChart from "../../components/TypePieChart";
import DistrictBarChart from "../../components/DistrictBarChart";
import { requireAdminPage } from "../../lib/session";

export const getServerSideProps = requireAdminPage;

export default function AdminStats({ admin }) {
  const [stats, setStats] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDivision, setSelectedDivision] = useState(null);
  const [activeTab, setActiveTab] = useState<"overview" | "trends" | "districts">("overview");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setStats(d.stats);
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

  return (
    <>
      <Head><title>পরিসংখ্যান — Nirbhoy</title></Head>
      <AdminHeader email={admin.email} />

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
        <h1 className="font-display text-xl sm:text-2xl font-semibold text-text-primary">পরিসংখ্যান</h1>
        <p className="mt-2 font-body text-xs sm:text-sm text-text-muted">প্ল্যাটফর্মের সামগ্রিক অবস্থা</p>

        {loading && <p className="mt-8 font-body text-sm text-text-muted">লোড হচ্ছে…</p>}
        {error && <p className="mt-8 font-body text-sm text-danger">{error}</p>}

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <div className="mt-4 sm:mt-6 overflow-x-auto scrollbar-none">
          <div className="flex gap-1 border-b border-border pb-px whitespace-nowrap">
            {[
              { key: "overview" as const, label: "সংক্ষিপ্ত" },
              { key: "trends" as const, label: "ট্রেন্ড" },
              { key: "districts" as const, label: "জেলা" },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`px-3 sm:px-4 py-2.5 font-terminal text-xs sm:text-sm transition-all duration-200 border-b-2 -mb-px shrink-0 ${
                  activeTab === key
                    ? "border-accent text-accent"
                    : "border-transparent text-text-muted hover:text-text-primary"
                }`}
              >
                $ {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Overview Tab ─────────────────────────────────────────────── */}
        {activeTab === "overview" && stats && (
          <>
            {/* Stat cards */}
            <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
              <StatCard label="মোট রিপোর্ট" value={stats.total} color="text-text-primary" />
              <StatCard label="অপেক্ষমাণ" value={stats.pending} color="text-text-muted" />
              <StatCard label="যাচাই চলছে" value={stats.reviewing} color="text-accent" />
              <StatCard label="প্রকাশিত" value={stats.published} color="text-teal" />
              <StatCard label="প্রত্যাখ্যাত" value={stats.rejected} color="text-danger" />
            </div>

            {/* Type breakdown + Pie chart */}
            <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
              <div className="card !p-4 sm:!p-6">
                <p className="font-mono text-xs text-text-faint">ঘটনা / অপরাধ</p>
                <p className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-text-primary">{stats.incidentCount}</p>
              </div>
              <div className="card !p-4 sm:!p-6">
                <p className="font-mono text-xs text-text-faint">সাধারণ অভিযোগ</p>
                <p className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-text-primary">{stats.grievanceCount}</p>
              </div>
              <div className="card !p-4 sm:!p-6">
                <p className="font-mono text-xs text-text-faint">প্রমাণসহ রিপোর্ট</p>
                <p className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-text-primary">{stats.withProof}</p>
                <p className="mt-1 font-mono text-xs text-text-faint">
                  {stats.total > 0 ? `${Math.round((stats.withProof / stats.total) * 100)}%` : "০%"}
                </p>
              </div>
            </div>

            {/* Type Pie Chart */}
            <div className="card mt-4 sm:mt-6 !p-4 sm:!p-6">
              <p className="font-terminal text-xs text-text-faint tracking-wider mb-4">$ রিপোর্টের ধরন</p>
              <TypePieChart incidents={stats.incidentCount || 0} grievances={stats.grievanceCount || 0} />
            </div>

            {/* Division-wise breakdown */}
            {stats.divisionBreakdown && stats.divisionBreakdown.length > 0 && (
              <div className="card mt-6 sm:mt-8 !p-4 sm:!p-6">
                <h3 className="font-display text-sm sm:text-base font-medium text-text-primary">বিভাগ অনুযায়ী রিপোর্ট</h3>
                <p className="mt-1 font-body text-xs text-text-muted">কোন বিভাগে কতটি রিপোর্ট জমা হয়েছে</p>
                <div className="mt-5 space-y-3">
                  {stats.divisionBreakdown.map((div) => (
                    <div key={div.name}>
                      <button
                        onClick={() => setSelectedDivision(selectedDivision === div.name ? null : div.name)}
                        className="w-full text-left group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-code text-sm font-medium text-text-primary truncate">{div.name}</span>
                            <span className="font-terminal text-xs text-text-faint shrink-0">
                              {selectedDivision === div.name ? "▲" : "▼"}
                            </span>
                          </div>
                          <span className="font-mono text-sm text-accent shrink-0 ml-2">{div.count}টি</span>
                        </div>
                        <div className="relative h-5 w-full overflow-hidden rounded-md bg-elevated2">
                          <div
                            className="h-full rounded-md bg-accent/60 transition-all duration-500"
                            style={{ width: `${div.percentage}%` }}
                          />
                          <span className="absolute inset-0 flex items-center px-2 font-terminal text-[10px] text-text-faint">
                            {div.percentage}%
                          </span>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily trend */}
            {stats.dailyCounts && stats.dailyCounts.length > 0 && (
              <div className="card mt-6 sm:mt-8 !p-4 sm:!p-6">
                <h3 className="font-display text-sm sm:text-base font-medium text-text-primary">গত ৩০ দিনের রিপোর্ট</h3>
                <div className="mt-4 flex items-end gap-[2px] sm:gap-1 h-24 sm:h-32 overflow-x-auto pb-2">
                  {stats.dailyCounts.map((d, _i) => {
                    const max = Math.max(...stats.dailyCounts.map((x) => x.count), 1);
                    const height = (d.count / max) * 100;
                    return (
                      <div key={d.date} className="group relative flex-1 min-w-[6px] sm:min-w-[4px]">
                        <div
                          className="w-full bg-accent/60 hover:bg-accent rounded-t transition-colors"
                          style={{ height: `${Math.max(height, 2)}%` }}
                        />
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-elevated2 border border-border rounded px-2 py-1 whitespace-nowrap z-10">
                          <p className="font-mono text-xs text-text-primary">{d.count}টি</p>
                          <p className="font-mono text-[10px] text-text-faint">{d.date}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Trends Tab ───────────────────────────────────────────────── */}
        {activeTab === "trends" && (
          <div className="mt-6 sm:mt-8">
            <div className="flex items-center gap-2 mb-4">
              <p className="font-code text-xs text-text-muted">
                সময়ের সাথে সাথে রিপোর্ট জমা পড়ার প্রবণতা — লাইন টগল করে নির্দিষ্ট ধরন দেখুন।
              </p>
            </div>
            <div className="card !p-4 sm:!p-6">
              <p className="font-terminal text-xs text-text-faint tracking-wider mb-4">$ সময় অনুযায়ী রিপোর্ট</p>
              <TrendChart data={trendsData?.monthly || []} loading={trendsLoading} />
            </div>
          </div>
        )}

        {/* ── Districts Tab ────────────────────────────────────────────── */}
        {activeTab === "districts" && (
          <div className="mt-6 sm:mt-8">
            <div className="flex items-center gap-2 mb-4">
              <p className="font-code text-xs text-text-muted">
                জেলা অনুযায়ী রিপোর্টের তুলনা — হোভার করে ঘটনা ও অভিযোগের সংখ্যা দেখুন।
              </p>
            </div>
            <div className="card !p-4 sm:!p-6">
              <p className="font-terminal text-xs text-text-faint tracking-wider mb-4">$ শীর্ষ জেলা (সর্বোচ্চ রিপোর্ট)</p>
              <DistrictBarChart data={trendsData?.districtData || []} loading={trendsLoading} />
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="card !p-3 sm:!p-6 text-center">
      <p className="font-mono text-[10px] sm:text-xs text-text-faint">{label}</p>
      <p className={`mt-1 sm:mt-2 font-display text-xl sm:text-3xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}