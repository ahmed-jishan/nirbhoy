import { useEffect, useState } from "react";
import Head from "next/head";
import AdminHeader from "../../components/AdminHeader";
import { requireAdminPage } from "../../lib/session";

export const getServerSideProps = requireAdminPage;

export default function AdminStats({ admin }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDivision, setSelectedDivision] = useState(null);

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

  return (
    <>
      <Head><title>পরিসংখ্যান — Nirbhoy</title></Head>
      <AdminHeader email={admin.email} />

      <section className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-text-primary">পরিসংখ্যান</h1>
        <p className="mt-2 font-body text-sm text-text-muted">প্ল্যাটফর্মের সামগ্রিক অবস্থা</p>

        {loading && <p className="mt-8 font-body text-sm text-text-muted">লোড হচ্ছে…</p>}
        {error && <p className="mt-8 font-body text-sm text-danger">{error}</p>}

        {stats && (
          <>
            {/* Stat cards */}
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
              <StatCard label="মোট রিপোর্ট" value={stats.total} color="text-text-primary" />
              <StatCard label="অপেক্ষমাণ" value={stats.pending} color="text-text-muted" />
              <StatCard label="যাচাই চলছে" value={stats.reviewing} color="text-accent" />
              <StatCard label="প্রকাশিত" value={stats.published} color="text-teal" />
              <StatCard label="প্রত্যাখ্যাত" value={stats.rejected} color="text-danger" />
            </div>

            {/* Type breakdown */}
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="card">
                <p className="font-mono text-xs text-text-faint">ঘটনা / অপরাধ</p>
                <p className="mt-2 font-display text-3xl font-semibold text-text-primary">{stats.incidentCount}</p>
              </div>
              <div className="card">
                <p className="font-mono text-xs text-text-faint">সাধারণ অভিযোগ</p>
                <p className="mt-2 font-display text-3xl font-semibold text-text-primary">{stats.grievanceCount}</p>
              </div>
              <div className="card">
                <p className="font-mono text-xs text-text-faint">প্রমাণসহ রিপোর্ট</p>
                <p className="mt-2 font-display text-3xl font-semibold text-text-primary">{stats.withProof}</p>
                <p className="mt-1 font-mono text-xs text-text-faint">
                  {stats.total > 0 ? `${Math.round((stats.withProof / stats.total) * 100)}%` : "০%"}
                </p>
              </div>
            </div>

            {/* Division-wise breakdown */}
            {stats.divisionBreakdown && stats.divisionBreakdown.length > 0 && (
              <div className="card mt-8">
                <h3 className="font-display text-base font-medium text-text-primary">বিভাগ অনুযায়ী রিপোর্ট</h3>
                <p className="mt-1 font-body text-xs text-text-muted">কোন বিভাগে কতটি রিপোর্ট জমা হয়েছে</p>
                <div className="mt-5 space-y-3">
                  {stats.divisionBreakdown.map((div) => (
                    <div key={div.name}>
                      <button
                        onClick={() => setSelectedDivision(selectedDivision === div.name ? null : div.name)}
                        className="w-full text-left group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-code text-sm font-medium text-text-primary">{div.name}</span>
                            <span className="font-terminal text-xs text-text-faint">
                              {selectedDivision === div.name ? "▲" : "▼"}
                            </span>
                          </div>
                          <span className="font-mono text-sm text-accent">{div.count}টি</span>
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

            {/* Top districts */}
            {stats.topDistricts && stats.topDistricts.length > 0 && (
              <div className="card mt-6">
                <h3 className="font-display text-base font-medium text-text-primary">শীর্ষ জেলা</h3>
                <p className="mt-1 font-body text-xs text-text-muted">সর্বোচ্চ রিপোর্ট জমা পড়েছে যেসব জেলায়</p>
                <div className="mt-5 space-y-2">
                  {stats.topDistricts.map((dist, idx) => (
                    <div key={dist.name} className="flex items-center gap-3">
                      <span className="w-5 text-center font-terminal text-xs text-text-faint">#{idx + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-code text-sm text-text-primary">{dist.name}</span>
                          <span className="font-mono text-xs text-accent">{dist.count}টি</span>
                        </div>
                        <div className="relative h-4 w-full overflow-hidden rounded-md bg-elevated2">
                          <div
                            className="h-full rounded-md bg-accent/40 transition-all duration-500"
                            style={{ width: `${dist.percentage}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-10 text-right font-terminal text-[10px] text-text-faint">{dist.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily trend */}
            {stats.dailyCounts.length > 0 && (
              <div className="card mt-8">
                <h3 className="font-display text-base font-medium text-text-primary">গত ৩০ দিনের রিপোর্ট</h3>
                <div className="mt-4 flex items-end gap-1 h-32">
                  {stats.dailyCounts.map((d, _i) => {
                    const max = Math.max(...stats.dailyCounts.map((x) => x.count), 1);
                    const height = (d.count / max) * 100;
                    return (
                      <div
                        key={d.date}
                        className="group relative flex-1 min-w-[4px]"
                      >
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
      </section>
    </>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="card text-center">
      <p className="font-mono text-xs text-text-faint">{label}</p>
      <p className={`mt-2 font-display text-3xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}