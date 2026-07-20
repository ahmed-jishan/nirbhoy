import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { StatCardSkeleton } from "../components/Skeleton";

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

export default function Stats() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const maxDistrictCount = data
    ? Math.max(...data.topDistricts.map((d) => d.count), 1)
    : 1;

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

        {/* Type breakdown */}
        {data && (
          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="card">
              <p className="font-terminal text-xs text-text-faint tracking-wider">$ রিপোর্টের ধরন</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-code text-sm text-text-primary">অপরাধ / ঘটনা</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-32 rounded-full bg-elevated2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#DC2626] transition-all duration-500"
                        style={{ width: `${data.total > 0 ? (data.incidents / data.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="font-terminal text-sm text-text-muted min-w-[3ch] text-right">{data.incidents}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-code text-sm text-text-primary">সাধারণ অভিযোগ</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-32 rounded-full bg-elevated2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent transition-all duration-500"
                        style={{ width: `${data.total > 0 ? (data.grievances / data.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="font-terminal text-sm text-text-muted min-w-[3ch] text-right">{data.grievances}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status breakdown */}
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

        {/* Top Districts */}
        {data && data.topDistricts.length > 0 && (
          <div className="mt-10 card">
            <p className="font-terminal text-xs text-text-faint tracking-wider">$ শীর্ষ জেলা (সর্বোচ্চ রিপোর্ট)</p>
            <div className="mt-4 space-y-2">
              {data.topDistricts.map((d, i) => (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="font-terminal text-xs text-text-faint w-5 text-right">{i + 1}.</span>
                  <span className="font-code text-sm text-text-primary flex-1">{d.name}</span>
                  <div className="flex-1 h-3 rounded-full bg-elevated2 overflow-hidden max-w-[200px]">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-500"
                      style={{ width: `${(d.count / maxDistrictCount) * 100}%` }}
                    />
                  </div>
                  <span className="font-terminal text-sm text-text-muted min-w-[3ch] text-right">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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