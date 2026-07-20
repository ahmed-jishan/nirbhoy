import { useEffect, useState, useMemo, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import AdminHeader from "../../components/AdminHeader";
import StatusBadge from "../../components/StatusBadge";
import { requireAdminPage } from "../../lib/session";

export const getServerSideProps = requireAdminPage;

const TYPE_LABEL = { incident: "অপরাধ / ঘটনা", grievance: "সাধারণ অভিযোগ" };
const TABS = [
  { key: "pending", label: "অপেক্ষমাণ" },
  { key: "reviewing", label: "যাচাই চলছে" },
  { key: "rejected", label: "প্রত্যাখ্যাত" },
  { key: "all", label: "সব" },
];

export default function AdminDashboard({ admin }) {
  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/admin/complaints?status=${status}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setItems(d.items || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status]);

  // Client-side search/filter — matches caseId, title, location, and type
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

  // Keyboard shortcut: Ctrl+K or Cmd+K to focus search
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Escape to clear search
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
      <Head><title>মডারেটর প্যানেল — Nirbhoy</title></Head>
      <AdminHeader email={admin.email} />

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="font-display text-2xl font-semibold text-text-primary">রিপোর্ট কিউ</h1>

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
              placeholder="কেস নং / শিরোনাম / লোকেশন দিয়ে সার্চ করুন…  (Ctrl+K)"
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

        {/* Status tabs + search result count */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setStatus(t.key)}
                className={`rounded-full border px-4 py-1.5 font-body text-xs transition-colors ${
                  status === t.key
                    ? "border-accent/60 bg-accent-soft text-accent"
                    : "border-borderStrong text-text-muted hover:text-text-primary"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {searchQuery && (
            <span className="font-mono text-xs text-text-faint">
              {filteredItems.length}টি ফলাফল
            </span>
          )}
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-border">
          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full text-left font-body text-sm">
              <thead>
                <tr className="border-b border-border bg-elevated text-xs uppercase tracking-wider text-text-faint">
                  <th className="px-4 py-3 font-medium">কেস</th>
                  <th className="px-4 py-3 font-medium">ধরন</th>
                  <th className="px-4 py-3 font-medium">শিরোনাম</th>
                  <th className="px-4 py-3 font-medium">প্রমাণ</th>
                  <th className="px-4 py-3 font-medium">স্ট্যাটাস</th>
                  <th className="px-4 py-3 font-medium">জমার তারিখ</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-text-muted">লোড হচ্ছে…</td></tr>
                )}
                {error && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-danger">{error}</td></tr>
                )}
                {!loading && !error && filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-text-muted">
                      {searchQuery
                        ? `"{searchQuery}" এর সাথে মিলে কিছু পাওয়া যায়নি।`
                        : "এই তালিকায় কিছু নেই।"}
                    </td>
                  </tr>
                )}
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-elevated/60">
                    <td className="px-4 py-3">
                      <Link href={`/admin/review/${item.id}`} className="font-mono text-xs text-accent hover:underline">
                        {highlightMatch(item.caseId, searchQuery)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{TYPE_LABEL[item.type] || item.type}</td>
                    <td className="px-4 py-3 text-text-primary">
                      <Link href={`/admin/review/${item.id}`} className="hover:underline">
                        {highlightMatch(item.title, searchQuery)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {item.proofCount > 0 ? `${item.proofCount}টি ফাইল` : "—"}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-3 font-mono text-xs text-text-faint">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString("bn-BD") : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-3 p-3">
            {loading && <p className="px-4 py-6 text-center text-text-muted">লোড হচ্ছে…</p>}
            {error && <p className="px-4 py-6 text-center text-danger">{error}</p>}
            {!loading && !error && filteredItems.length === 0 && (
              <p className="px-4 py-6 text-center text-text-muted">
                {searchQuery
                  ? `"{searchQuery}" এর সাথে মিলে কিছু পাওয়া যায়নি।`
                  : "এই তালিকায় কিছু নেই।"}
              </p>
            )}
            {filteredItems.map((item) => (
              <Link
                key={item.id}
                href={`/admin/review/${item.id}`}
                className="block rounded-lg border border-border bg-elevated/60 p-4 hover:bg-elevated transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-accent">{item.caseId}</span>
                  <StatusBadge status={item.status} />
                </div>
                <p className="font-body text-sm text-text-primary font-medium truncate">{item.title}</p>
                <div className="mt-2 flex items-center justify-between font-mono text-xs text-text-faint">
                  <span>{TYPE_LABEL[item.type] || item.type}</span>
                  <span>
                    {item.proofCount > 0 ? `${item.proofCount}টি ফাইল` : "—"} ·
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString("bn-BD") : ""}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/** Highlight matching substring in search results */
function highlightMatch(text, query) {
  if (!query.trim() || !text) return text;
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