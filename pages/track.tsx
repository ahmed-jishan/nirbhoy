import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import StatusBadge from "../components/StatusBadge";

export default function Track() {
  const [caseId, setCaseId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    if (!caseId.trim()) return setError("একটি কেস নম্বর লিখুন।");

    setLoading(true);
    try {
      const res = await fetch(`/api/complaints/status?caseId=${encodeURIComponent(caseId.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "খুঁজে পাওয়া যায়নি।");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head><title>স্ট্যাটাস যাচাই — Nirbhoy</title></Head>
      <SiteHeader />

      <section className="mx-auto max-w-md px-6 py-16">
        <h1 className="font-display text-3xl font-semibold text-text-primary">স্ট্যাটাস যাচাই করুন</h1>
        <p className="mt-3 font-body text-sm text-text-muted">
          জমা দেওয়ার সময় পাওয়া কেস নম্বরটি লিখুন।
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex gap-2">
          <input
            className="field-input font-mono"
            placeholder="NRB-2026-00147"
            value={caseId}
            onChange={(e) => setCaseId(e.target.value)}
          />
          <button className="btn-primary shrink-0" disabled={loading}>
            {loading ? "খোঁজা হচ্ছে…" : "যাচাই করুন"}
          </button>
        </form>

        {error && <p className="mt-4 font-body text-sm text-danger">{error}</p>}

        {result && (
          <div className="card mt-8">
            <p className="font-mono text-xs text-text-faint">{result.caseId}</p>
            <div className="mt-3">
              <StatusBadge status={result.status} />
            </div>
            {result.updatedAt && (
              <p className="mt-3 font-mono text-xs text-text-faint">
                সর্বশেষ আপডেট: {new Date(result.updatedAt).toLocaleString("bn-BD")}
              </p>
            )}
            {result.status === "published" && (
              <Link
                href={`/case/${result.caseId}`}
                className="btn-primary mt-4 !inline-flex text-xs"
              >
                টাইমলাইন ও বিস্তারিত দেখুন →
              </Link>
            )}
          </div>
        )}
      </section>

      <SiteFooter />
    </>
  );
}
