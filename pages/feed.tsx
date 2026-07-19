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
  const [viewMode, setViewMode] = useState("list");
  const [activeCaseId, setActiveCaseId] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError("");
    setActiveCaseId(null);
    fetch(`/api/complaints?type=${filter}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setItems(d.items || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filter]);

  const mapItems = items.filter((item) => item.lat && item.lng);

  return (
    <>
      <Head><title>জনসাধারণের ফিড — Nirbhoy</title></Head>
      <SiteHeader />

      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="flex items-center gap-3">
          <span className="font-terminal text-sm text-text-muted">$</span>
          <h1 className="font-display text-3xl font-semibold text-text-primary">জনসাধারণের ফিড</h1>
        </div>
        <p className="mt-3 max-w-lg font-code text-sm leading-relaxed text-text-muted">
          এখানে শুধু যাচাইকৃত ও মডারেট করা সারাংশ দেখানো হয় — কোনো ব্যক্তির নাম কখনোই দেখানো হয় না।
        </p>

        <div className="mt-8 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2">
            {["all", "incident", "grievance"].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`rounded-none border px-4 py-1.5 font-terminal text-xs tracking-wider transition-colors ${
                  filter === t
                    ? "border-accent/60 bg-accent-glow text-accent"
                    : "border-borderStrong text-text-muted hover:text-text-primary"
                }`}
              >
                {t === "all" ? "$ সব" : `$ ${TYPE_LABEL[t]}`}
              </button>
            ))}
          </div>

          <div className="flex gap-1 rounded-none border border-border p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-none px-3 py-1.5 font-terminal text-xs transition-colors ${
                viewMode === "list"
                  ? "bg-accent text-bg"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              তালিকা
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`rounded-none px-3 py-1.5 font-terminal text-xs transition-colors ${
                viewMode === "map"
                  ? "bg-accent text-bg"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              মানচিত্র
            </button>
          </div>
        </div>

        {viewMode === "map" && (
          <div className="mt-6">
            {mapItems.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                <MapView
                  items={mapItems}
                  activeCaseId={activeCaseId}
                  onCaseSelect={setActiveCaseId}
                />
                {/* Mini case list for map interaction */}
                <div className="max-h-[450px] overflow-y-auto space-y-2 rounded-md border border-border bg-elevated/60 p-3">
                  <p className="font-terminal text-xs text-text-faint mb-2">
                    $ লোকেশন সহ রিপোর্ট ({mapItems.length}টি)
                  </p>
                  {mapItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveCaseId(item.caseId)}
                      className={`w-full text-left rounded-md border p-3 transition-colors ${
                        activeCaseId === item.caseId
                          ? "border-accent/60 bg-accent-soft/40"
                          : "border-border bg-elevated hover:border-accent/30"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-terminal text-xs text-accent">{item.caseId}</span>
                        <span className="font-terminal text-[10px] text-text-faint">
                          {item.locationPrecision === "street" ? "রাস্তা" :
                           item.locationPrecision === "thana" ? "থানা" : "জেলা"}
                        </span>
                      </div>
                      <p className="mt-1 font-code text-xs text-text-primary truncate">{item.title}</p>
                      <p className="mt-0.5 font-terminal text-[10px] text-text-faint truncate">
                        {item.location ? item.location.split(",").slice(0, 2).join(", ") : ""}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card text-center">
                <p className="font-code text-sm text-text-muted">
                  <span className="term-err">[!]</span> মানচিত্রে দেখানোর মতো কোনো লোকেশন-সহ রিপোর্ট নেই।
                </p>
              </div>
            )}
          </div>
        )}

        {viewMode === "list" && (
          <div className="mt-8 space-y-4">
            {loading && (
              <div className="card text-center">
                  <p className="font-terminal text-sm text-text-muted animate-pulse">
                    $ loading...
                  </p>
              </div>
            )}
            {error && (
              <p className="rounded-none border border-danger/40 bg-danger-soft px-4 py-3 font-code text-sm text-danger">
                <span className="term-err">[!]</span> {error}
              </p>
            )}
            {!loading && !error && items.length === 0 && (
              <div className="card text-center">
                <p className="font-code text-sm text-text-muted">
                  <span className="term-info">$</span> এখনো কোনো প্রকাশিত রিপোর্ট নেই। প্রথম রিপোর্টটি আপনি জমা দিতে পারেন।
                </p>
              </div>
            )}
            {items.map((item, idx) => (
              <article key={item.id} className="card" style={{ animationDelay: `${idx * 0.05}s` }}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-terminal text-xs tracking-widest text-text-primary">
                    {item.caseId}
                  </span>
                  <span className="badge-published">
                    {TYPE_LABEL[item.type] || item.type}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-lg font-medium text-text-primary">{item.title}</h3>
                {item.summary && (
                  <p className="mt-2 font-code text-sm leading-relaxed text-text-muted">{item.summary}</p>
                )}
                <div className="mt-4 flex items-center justify-between font-terminal text-xs text-text-faint">
                  <span>{'>'} {item.location || "স্থান উল্লেখ নেই"}</span>
                  <span>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("bn-BD") : ""}</span>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <p className="mt-8 text-center font-terminal text-xs text-text-faint">
            $ মোট {items.length}টি রিপোর্ট · {mapItems.length}টি মানচিত্রে দেখানো যাবে
          </p>
        )}
      </section>

      <SiteFooter />
    </>
  );
}