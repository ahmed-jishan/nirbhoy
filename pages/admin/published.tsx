import { useEffect, useState, useMemo, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import AdminHeader from "../../components/AdminHeader";
import { requireAdminPage } from "../../lib/session";

export const getServerSideProps = requireAdminPage;

const TYPE_LABEL = { incident: "অপরাধ / ঘটনা", grievance: "সাধারণ অভিযোগ" };

export default function AdminPublished({ admin }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  function load() {
    setLoading(true);
    fetch(`/api/admin/complaints?status=published`)
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items || []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  // Client-side search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.trim().toLowerCase();
    return items.filter(
      (item) =>
        item.caseId.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        (item.location && item.location.toLowerCase().includes(q)) ||
        (TYPE_LABEL[item.type] && TYPE_LABEL[item.type].includes(q))
    );
  }, [items, searchQuery]);

  // Keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        setSearchQuery("");
        searchInputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <Head><title>প্রকাশিত রিপোর্ট — Nirbhoy</title></Head>
      <AdminHeader email={admin.email} />

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-text-primary">প্রকাশিত রিপোর্ট</h1>
            <p className="mt-1 font-body text-sm text-text-muted">
              এগুলো এখন সবাই জনসাধারণের ফিডে দেখতে পাচ্ছে।
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint pointer-events-none"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="কেস নং / শিরোনাম / লোকেশন…  (Ctrl+K)"
              className="w-full rounded-md border border-borderStrong bg-bg/80 pl-9 pr-3 py-2.5 font-code text-sm text-text-primary placeholder:text-text-faint focus:border-accent/50 focus:outline-none focus:shadow-[0_0_8px_rgba(13,148,136,0.06)] transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-primary transition-colors"
                aria-label="সার্চ মুছুন"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {searchQuery && (
          <div className="mt-4">
            <span className="font-mono text-xs text-text-faint">
              {filteredItems.length}টি ফলাফল
            </span>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {loading && <p className="font-body text-sm text-text-muted">লোড হচ্ছে…</p>}
          {!loading && filteredItems.length === 0 && (
            <p className="font-body text-sm text-text-muted">
              {searchQuery
                ? `"{searchQuery}" এর সাথে মিলে কিছু পাওয়া যায়নি।`
                : "এখনো কিছু প্রকাশিত হয়নি।"}
            </p>
          )}
          {filteredItems.map((item) => (
            <Link
              key={item.id}
              href={`/admin/review/${item.id}`}
              className="card flex items-center justify-between !p-4 hover:border-accent/40"
            >
              <div>
                <span className="font-mono text-xs text-text-faint">{item.caseId}</span>
                <p className="mt-1 font-body text-sm text-text-primary">
                  {highlightMatch(item.title, searchQuery)}
                </p>
              </div>
              <span className="font-mono text-xs text-text-muted">{TYPE_LABEL[item.type]}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

/** Highlight matching substring in search results */
function highlightMatch(text, query) {
  if (!query || !query.trim() || !text) return text;
  const q = query.trim().toLowerCase();
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent/20 text-accent rounded-sm px-0.5">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}