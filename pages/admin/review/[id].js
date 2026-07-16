import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import AdminHeader from "../../../components/AdminHeader";
import StatusBadge from "../../../components/StatusBadge";
import { requireAdminPage } from "../../../lib/session";

export const getServerSideProps = requireAdminPage;

const TYPE_LABEL = { incident: "অপরাধ / ঘটনা", grievance: "সাধারণ অভিযোগ" };

export default function ReviewComplaint({ admin }) {
  const router = useRouter();
  const { id } = router.query;

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [publicTitle, setPublicTitle] = useState("");
  const [publicSummary, setPublicSummary] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [proofUrls, setProofUrls] = useState([]);
  const [proofLoading, setProofLoading] = useState(false);
  const [selectedProof, setSelectedProof] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/complaints/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setComplaint(d.complaint);
        setPublicTitle(d.complaint.publicTitle || d.complaint.title);
        setPublicSummary(d.complaint.publicSummary || "");
        setRejectionReason(d.complaint.rejectionReason || "");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function loadProofs() {
    setProofLoading(true);
    try {
      const res = await fetch(`/api/admin/proof-url?id=${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProofUrls(data.urls);
      if (data.urls.length > 0) setSelectedProof(data.urls[0]);
    } catch (e) {
      setError(e.message);
    } finally {
      setProofLoading(false);
    }
  }

  async function updateStatus(status) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/complaints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, publicTitle, publicSummary, rejectionReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setComplaint(data.complaint);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <AdminHeader email={admin.email} />
        <p className="mx-auto max-w-3xl px-6 py-10 font-body text-sm text-text-muted">লোড হচ্ছে…</p>
      </>
    );
  }

  if (error && !complaint) {
    return (
      <>
        <AdminHeader email={admin.email} />
        <p className="mx-auto max-w-3xl px-6 py-10 font-body text-sm text-danger">{error}</p>
      </>
    );
  }

  return (
    <>
      <Head><title>{complaint.caseId} — Nirbhoy Review</title></Head>
      <AdminHeader email={admin.email} />

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-mono text-xs text-text-faint">{complaint.caseId}</span>
            <h1 className="mt-1 font-display text-2xl font-semibold text-text-primary">{complaint.title}</h1>
          </div>
          <StatusBadge status={complaint.status} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h3 className="font-display text-base font-medium text-text-primary">মূল রিপোর্ট (শুধু আপনার জন্য)</h3>
            <dl className="mt-4 space-y-3 font-body text-sm">
              <div>
                <dt className="font-mono text-xs text-text-faint">ধরন</dt>
                <dd className="text-text-primary">{TYPE_LABEL[complaint.type] || complaint.type}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs text-text-faint">বিবরণ</dt>
                <dd className="whitespace-pre-wrap text-text-primary">{complaint.description}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs text-text-faint">স্থান</dt>
                <dd className="text-text-primary">{complaint.location || "উল্লেখ নেই"}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs text-text-faint">জমার সময়</dt>
                <dd className="text-text-primary">
                  {complaint.createdAt ? new Date(complaint.createdAt).toLocaleString("bn-BD") : "—"}
                </dd>
              </div>
            </dl>

            {/* Proof files section */}
            {complaint.proofs && complaint.proofs.length > 0 ? (
              <div className="mt-5 border-t border-border pt-4">
                <p className="mb-3 font-mono text-xs text-text-faint">
                  {complaint.proofs.length}টি প্রমাণ ফাইল
                </p>

                {proofUrls.length === 0 ? (
                  <button onClick={loadProofs} disabled={proofLoading} className="btn-secondary text-xs">
                    {proofLoading ? "লোড হচ্ছে…" : "প্রমাণ দেখুন (৫ মিনিটের জন্য লিংক)"}
                  </button>
                ) : (
                  <div className="space-y-3">
                    {/* Selected proof preview */}
                    {selectedProof && (
                      <div className="rounded-md border border-border bg-bg overflow-hidden">
                        {selectedProof.resourceType === "video" ? (
                          <video src={selectedProof.url} controls className="w-full max-h-[400px] object-contain" />
                        ) : (
                          <img src={selectedProof.url} alt="Proof" className="w-full max-h-[400px] object-contain" />
                        )}
                      </div>
                    )}
                    {/* Thumbnail strip */}
                    <div className="flex flex-wrap gap-2">
                      {proofUrls.map((p, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedProof(p)}
                          className={`relative h-16 w-16 overflow-hidden rounded-md border-2 transition-colors ${
                            selectedProof?.publicId === p.publicId
                              ? "border-amber"
                              : "border-border hover:border-amber/60"
                          }`}
                        >
                          {p.resourceType === "video" ? (
                            <div className="flex h-full w-full items-center justify-center bg-elevated2">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="#E8A33D">
                                <polygon points="8,5 19,12 8,19" />
                              </svg>
                            </div>
                          ) : (
                            <img src={p.url} alt={`Proof ${i + 1}`} className="h-full w-full object-cover" />
                          )}
                          <span className="absolute bottom-0.5 right-1 rounded bg-bg/80 px-1 font-mono text-[10px] text-text-faint">
                            {i + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-5 border-t border-border pt-4 font-mono text-xs text-text-faint">কোনো প্রমাণ ফাইল জমা দেওয়া হয়নি।</p>
            )}
          </div>

          <div className="card">
            <h3 className="font-display text-base font-medium text-text-primary">পাবলিক ফিডে যা প্রকাশ হবে</h3>
            <p className="mt-1 font-body text-xs text-text-muted">কোনো নাম বা শনাক্তযোগ্য তথ্য লিখবেন না।</p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="field-label">পাবলিক শিরোনাম</label>
                <input className="field-input" value={publicTitle} onChange={(e) => setPublicTitle(e.target.value)} />
              </div>
              <div>
                <label className="field-label">পাবলিক সারাংশ</label>
                <textarea
                  className="field-input min-h-[110px] resize-y"
                  value={publicSummary}
                  onChange={(e) => setPublicSummary(e.target.value)}
                  placeholder="যেমন: এলাকায় একটি চুরির ঘটনা রিপোর্ট হয়েছে এবং স্থানীয় প্রশাসনকে জানানো হয়েছে।"
                />
              </div>
              <div>
                <label className="field-label">প্রত্যাখ্যানের কারণ (ঐচ্ছিক)</label>
                <input className="field-input" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
              </div>
            </div>

            {error && <p className="mt-3 font-body text-sm text-danger">{error}</p>}

            <div className="mt-6 flex flex-wrap gap-2">
              <button onClick={() => updateStatus("reviewing")} disabled={saving} className="btn-secondary text-xs">
                যাচাই চলছে চিহ্নিত করুন
              </button>
              <button onClick={() => updateStatus("published")} disabled={saving} className="btn-primary text-xs">
                প্রকাশ করুন
              </button>
              <button onClick={() => updateStatus("rejected")} disabled={saving} className="btn-secondary text-xs !border-danger/40 !text-danger">
                প্রত্যাখ্যান করুন
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}