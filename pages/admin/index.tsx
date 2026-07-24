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

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-text-primary">রিপোর্ট কিউ</h1>

          {/* Search bar */}
          <div className="relative w-full sm:w-72 lg:w-80">
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
        <div className="mt-4 sm:mt-6 flex items-center justify-between gap-3">
          <div className="overflow-x-auto scrollbar-none flex-1 min-w-0">
            <div className="flex gap-4 sm:gap-6 border-b border-border whitespace-nowrap">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setStatus(t.key)}
                  className={`relative pb-2 font-body text-xs transition-colors shrink-0 ${
                    status === t.key
                      ? "text-accent"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {t.label}
                  {status === t.key && (
                    <span className="absolute -bottom-px left-1/2 -translate-x-1/2 h-[2px] w-12 sm:w-16 bg-accent rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
          {searchQuery && (
            <span className="font-mono text-xs text-text-faint shrink-0">
              {filteredItems.length}টি ফলাফল
            </span>
          )}
        </div>

        <div className="mt-4 sm:mt-6 overflow-x-auto rounded-lg border border-border">
          {/* Desktop table */}
          <div className="min-w-[640px]">
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
                  <ProofRow key={item.id} item={item} searchQuery={searchQuery} />
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

/** Individual table row with proof visibility toggle */
function ProofRow({ item, searchQuery }: { item: any; searchQuery: string }) {
  const [visible, setVisible] = useState(item.proofsVisible);
  const [toggling, setToggling] = useState(false);

  async function toggleProofs(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (toggling) return;

    setToggling(true);
    const newVal = !visible;
    try {
      const res = await fetch(`/api/admin/complaints/${item.id}/proofs-visible`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofsVisible: newVal }),
      });
      const data = await res.json();
      if (res.ok) setVisible(data.proofsVisible);
    } catch {
      // silently fail — user can retry
    } finally {
      setToggling(false);
    }
  }

  return (
    <tr className="border-b border-border last:border-0 hover:bg-elevated/60">
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
      <td className="px-4 py-3">
        {item.proofCount > 0 ? (
          <button
            type="button"
            onClick={toggleProofs}
            disabled={toggling}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-terminal text-[10px] transition-all duration-200 ${
              visible
                ? "border-accent/40 bg-accent-soft/40 text-accent hover:bg-accent-soft/60"
                : "border-borderStrong bg-elevated text-text-faint hover:border-accent/30 hover:text-text-muted"
            } disabled:opacity-50`}
            title={visible ? "প্রমাণ দৃশ্যমান — ক্লিক করে লুকান" : "প্রমাণ লুকানো — ক্লিক করে দেখান"}
          >
            <span className={`inline-block h-2 w-2 rounded-full ${visible ? "bg-accent" : "bg-text-faint"}`} />
            {visible ? "Active" : "Inactive"}
          </button>
        ) : (
          <span className="text-text-faint font-terminal text-[10px]">—</span>
        )}
      </td>
      <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
      <td className="px-4 py-3 font-mono text-xs text-text-faint">
        {item.createdAt ? new Date(item.createdAt).toLocaleDateString("bn-BD") : ""}
      </td>
    </tr>
  );
}

/** Highlight matching substring in search results */
function highlightMatch(text: string, query: string) {
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