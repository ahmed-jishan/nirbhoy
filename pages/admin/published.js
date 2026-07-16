import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import AdminHeader from "../../components/AdminHeader";
import { requireAdminPage } from "../../lib/session";

export const getServerSideProps = requireAdminPage;

const TYPE_LABEL = { incident: "অপরাধ / ঘটনা", grievance: "সাধারণ অভিযোগ" };

export default function AdminPublished({ admin }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch(`/api/admin/complaints?status=published`)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <>
      <Head><title>প্রকাশিত রিপোর্ট — Nirbhoy</title></Head>
      <AdminHeader email={admin.email} />

      <section className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-text-primary">প্রকাশিত রিপোর্ট</h1>
        <p className="mt-2 font-body text-sm text-text-muted">
          এগুলো এখন সবাই জনসাধারণের ফিডে দেখতে পাচ্ছে।
        </p>

        <div className="mt-6 space-y-3">
          {loading && <p className="font-body text-sm text-text-muted">লোড হচ্ছে…</p>}
          {!loading && items.length === 0 && (
            <p className="font-body text-sm text-text-muted">এখনো কিছু প্রকাশিত হয়নি।</p>
          )}
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/admin/review/${item.id}`}
              className="card flex items-center justify-between !p-4 hover:border-amber/40"
            >
              <div>
                <span className="font-mono text-xs text-text-faint">{item.caseId}</span>
                <p className="mt-1 font-body text-sm text-text-primary">{item.title}</p>
              </div>
              <span className="font-mono text-xs text-text-muted">{TYPE_LABEL[item.type]}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
