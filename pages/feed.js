import { useEffect, useState } from "react";
import Head from "next/head";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import MapView from "../components/MapView";

const TYPE_LABEL = { incident: "অপরাধ / ঘটনা", grievance: "সাধারণ অভিযোগ" };

export default function Feed() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("list"); // "list" or "map"

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/complaints?type=${filter}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setItems(d.items || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filter]);

  // Filter items that have location data for the map
  const mapItems = items.filter((item) => item.location);

  return (
    <>
      <Head><title>জনসাধারণের ফিড — Nirbhoy</title></Head>
      <SiteHeader />

      <section className="mx-auto max-w-5xl px-6 py-14">
        <h1 className="font-display text-3xl font-semibold text-text-primary">জনসাধারণের ফিড</h1>
        <p className="mt-3 max-w-lg font-body text-sm leading-relaxed text-text-muted">
          এখানে শুধু যাচাইকৃত ও মডারেট করা সারাংশ দেখানো হয় — কোনো ব্যক্তির নাম কখনোই দেখানো হয় না।
        </p>

        <div className="mt-8 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2">
            {["all", "incident", "grievance"].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`rounded-full border px-4 py-1.5 font-body text-xs transition-colors ${
                  filter === t
                    ? "border-amber/60 bg-amber-soft text-amber"
                    : "border-borderStrong text-text-muted hover:text-text-primary"
                }`}
              >
                {t === "all" ? "সব" : TYPE_LABEL[t]}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex gap-1 rounded-lg border border-border p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-md px-3 py-1.5 font-body text-xs transition-colors ${
                viewMode === "list"
                  ? "bg-amber text-bg"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              তালিকা
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`rounded-md px-3 py-1.5 font-body text-xs transition-colors ${
                viewMode === "map"
                  ? "bg-amber text-bg"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              মানচিত্র
            </button>
          </div>
        </div>

        {/* Map view */}
        {viewMode === "map" && (
          <div className="mt-6">
            {mapItems.length > 0 ? (
              <MapView items={mapItems} />
            ) : (
              <div className="card text-center">
                <p className="font-body text-sm text-text-muted">
                  মানচিত্রে দেখানোর মতো কোনো লোকেশন-সহ রিপোর্ট নেই।
                </p>
              </div>
            )}
          </div>
        )}

        {/* List view */}
        {viewMode === "list" && (
          <div className="mt-8 space-y-4">
            {loading && <p className="font-body text-sm text-text-muted">লোড হচ্ছে…</p>}
            {error && <p className="font-body text-sm text-danger">{error}</p>}
            {!loading && !error && items.length === 0 && (
              <div className="card text-center">
                <p className="font-body text-sm text-text-muted">
                  এখনো কোনো প্রকাশিত রিপোর্ট নেই। প্রথম রিপোর্টটি আপনি জমা দিতে পারেন।
                </p>
              </div>
            )}
            {items.map((item) => (
              <article key={item.id} className="card">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-text-faint">
                    {item.caseId}
                  </span>
                  <span className="rounded-full bg-elevated2 px-2.5 py-1 font-mono text-[11px] text-text-muted">
                    {TYPE_LABEL[item.type] || item.type}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-lg font-medium text-text-primary">{item.title}</h3>
                {item.summary && (
                  <p className="mt-2 font-body text-sm leading-relaxed text-text-muted">{item.summary}</p>
                )}
                <div className="mt-4 flex items-center justify-between font-mono text-xs text-text-faint">
                  <span>{item.location || "স্থান উল্লেখ নেই"}</span>
                  <span>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("bn-BD") : ""}</span>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Summary */}
        {!loading && !error && items.length > 0 && (
          <p className="mt-8 text-center font-mono text-xs text-text-faint">
            মোট {items.length}টি রিপোর্ট · {mapItems.length}টি মানচিত্রে দেখানো যাবে
          </p>
        )}
      </section>

      <SiteFooter />
    </>
  );
}
