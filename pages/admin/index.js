import { useEffect, useState } from "react";
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

  return (
    <>
      <Head><title>মডারেটর প্যানেল — Nirbhoy</title></Head>
      <AdminHeader email={admin.email} />

      <section className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-text-primary">রিপোর্ট কিউ</h1>

        <div className="mt-6 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setStatus(t.key)}
              className={`rounded-full border px-4 py-1.5 font-body text-xs transition-colors ${
                status === t.key
                  ? "border-amber/60 bg-amber-soft text-amber"
                  : "border-borderStrong text-text-muted hover:text-text-primary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-border">
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
              {!loading && !error && items.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-text-muted">এই তালিকায় কিছু নেই।</td></tr>
              )}
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0 hover:bg-elevated/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/review/${item.id}`} className="font-mono text-xs text-amber hover:underline">
                      {item.caseId}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{TYPE_LABEL[item.type] || item.type}</td>
                  <td className="px-4 py-3 text-text-primary">
                    <Link href={`/admin/review/${item.id}`} className="hover:underline">{item.title}</Link>
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {item.proofCount > 0
                      ? `${item.proofCount}টি ফাইল`
                      : "—"}
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
      </section>
    </>
  );
}
