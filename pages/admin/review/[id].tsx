import { useEffect, useState, useRef } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import AdminHeader from "../../../components/AdminHeader";
import StatusBadge from "../../../components/StatusBadge";
import AdminUpdatePanel from "../../../components/AdminUpdatePanel";
import { requireAdminPage } from "../../../lib/session";
import { googleMapsLink, osmMapsLink } from "../../../lib/mapLinks";

// Leaflet needs `window`, so keep the map view client-only.
const MapView = dynamic(() => import("../../../components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="rounded-md border border-border bg-elevated/60 h-[300px] flex items-center justify-center">
      <p className="font-terminal text-xs text-text-muted animate-pulse">$ loading map...</p>
    </div>
  ),
});

// 3D modal — MapLibre only ships when the admin actually opens the 3D view.
const Map3DModal = dynamic(() => import("../../../components/Map3DModal"), {
  ssr: false,
});

export const getServerSideProps = requireAdminPage;

const TYPE_LABEL = { incident: "অপরাধ / ঘটনা", grievance: "সাধারণ অভিযোগ" };
const PRECISION_LABEL = {
  exact: "সঠিক অবস্থান (ব্যবহারকারী পিন করেছেন)",
  street: "রাস্তা স্তর",
  thana: "থানা স্তর",
  district: "জেলা স্তর",
};
const FETCH_TIMEOUT = 15000; // 15 seconds

/** Admin proof viewer — collapsible, always fetches signed URLs on expand */
function ProofsViewer({
  proofs,
  complaintId,
}: {
  proofs: Array<{ publicId: string; resourceType: string }>;
  complaintId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [proofUrls, setProofUrls] = useState<Array<{ url: string; resourceType: string; publicId: string }>>([]);
  const [selectedProof, setSelectedProof] = useState<{ url: string; resourceType: string; publicId: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || proofUrls.length > 0 || !complaintId) return;
    setLoading(true);
    fetch(`/api/admin/proof-url?id=${encodeURIComponent(complaintId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.urls)) {
          setProofUrls(d.urls);
          if (d.urls.length > 0) setSelectedProof(d.urls[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, proofUrls.length, complaintId]);

  return (
    <div className="mt-5 border-t border-border pt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <p className="font-mono text-xs text-text-faint">
          {proofs.length}টি প্রমাণ ফাইল
        </p>
        <span className={`font-mono text-[10px] text-accent transition-transform ${open ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-3 animate-fade-in">
          {loading && (
            <p className="font-mono text-xs text-text-muted animate-pulse">$ লোড হচ্ছে...</p>
          )}
          {!loading && proofUrls.length === 0 && (
            <p className="font-mono text-xs text-text-faint">প্রমাণ লোড করা যায়নি।</p>
          )}
          {!loading && proofUrls.length > 0 && (
            <>
              {selectedProof && (
                <div className="rounded-md border border-border bg-bg overflow-hidden">
                  {selectedProof.resourceType === "video" ? (
                    <video src={selectedProof.url} controls className="w-full max-h-[400px] object-contain" />
                  ) : (
                    <img src={selectedProof.url} alt="Proof" className="w-full max-h-[400px] object-contain" />
                  )}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {proofUrls.map((p, i) => (
                  <button
                    key={p.publicId}
                    type="button"
                    onClick={() => setSelectedProof(p)}
                    className={`relative h-16 w-16 overflow-hidden rounded-md border-2 transition-colors ${
                      selectedProof?.publicId === p.publicId
                        ? "border-accent"
                        : "border-border hover:border-accent/60"
                    }`}
                  >
                    {p.resourceType === "video" ? (
                      <div className="flex h-full w-full items-center justify-center bg-elevated2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#7C8BA0">
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
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReviewComplaint({ admin }) {
  const router = useRouter();
  const { id } = router.query;
  const complaintId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : null;

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [actionType, setActionType] = useState("");

  const [publicTitle, setPublicTitle] = useState("");
  const [publicSummary, setPublicSummary] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [proofsVisible, setProofsVisible] = useState(false);
  const [show3D, setShow3D] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!complaintId) return;
    const thisRequest = ++requestIdRef.current;
    setLoading(true);
    setError("");
    setComplaint(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    fetch(`/api/admin/complaints/${encodeURIComponent(complaintId)}`, { signal: controller.signal })
      .then((r) => {
        if (requestIdRef.current !== thisRequest) return null;
        return r.json();
      })
      .then((d) => {
        if (requestIdRef.current !== thisRequest || !d) return;
        if (d.error) throw new Error(d.error);
        setComplaint(d.complaint);
        setPublicTitle(d.complaint.publicTitle || d.complaint.title);
        setPublicSummary(d.complaint.publicSummary || "");
        setRejectionReason(d.complaint.rejectionReason || "");
        setProofsVisible(Boolean(d.complaint.proofsVisible));
      })
      .catch((e) => {
        if (requestIdRef.current !== thisRequest) return;
        if (e.name === "AbortError") {
          setError("সার্ভার থেকে সাড়া পাওয়া যায়নি। আবার চেষ্টা করুন।");
        } else {
          setError(e.message);
        }
      })
      .finally(() => {
        if (requestIdRef.current !== thisRequest) return;
        clearTimeout(timeout);
        setLoading(false);
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [id]);

  async function updateStatus(status) {
    if (status === "published") {
      if (!publicSummary || publicSummary.trim().length < 10) {
        setError("পাবলিক সারাংশ কমপক্ষে ১০ অক্ষর লিখুন। কোনো নাম বা শনাক্তযোগ্য তথ্য দেবেন না।");
        return;
      }
    }

    setSaving(true);
    setError("");
    setSuccessMsg("");
    setActionType(status);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const res = await fetch(`/api/admin/complaints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, publicTitle, publicSummary, rejectionReason, proofsVisible }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setComplaint(data.complaint);

      if (status === "published") setSuccessMsg("✅ রিপোর্ট সফলভাবে প্রকাশিত হয়েছে!");
      else if (status === "reviewing") setSuccessMsg("✅ স্ট্যাটাস 'যাচাই চলছে' এ আপডেট করা হয়েছে।");
      else if (status === "rejected") setSuccessMsg("✅ রিপোর্ট প্রত্যাখ্যান করা হয়েছে।");

      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (e) {
      if (e.name === "AbortError") {
        setError("সার্ভার থেকে সাড়া পাওয়া যায়নি। আবার চেষ্টা করুন।");
      } else {
        setError(e.message || "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      }
    } finally {
      setSaving(false);
      setActionType("");
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
              {complaint.lat && complaint.lng && (
                <div>
                  <dt className="font-mono text-xs text-text-faint">নির্ভুলতা</dt>
                  <dd className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] ${
                      complaint.locationPrecision === "exact"
                        ? "border-accent/50 bg-accent-soft text-accent"
                        : "border-border text-text-muted"
                    }`}>
                      {complaint.locationPrecision === "exact" && "⚡ "}
                      {PRECISION_LABEL[complaint.locationPrecision] || "জেলা স্তর"}
                    </span>
                    <span className="font-mono text-[11px] text-text-faint">
                      LAT {complaint.lat.toFixed(6)} · LNG {complaint.lng.toFixed(6)}
                    </span>
                  </dd>
                </div>
              )}
              <div>
                <dt className="font-mono text-xs text-text-faint">জমার সময়</dt>
                <dd className="text-text-primary">
                  {complaint.createdAt ? new Date(complaint.createdAt).toLocaleString("bn-BD") : "—"}
                </dd>
              </div>
            </dl>

            {complaint.lat && complaint.lng && (
              <div className="mt-5 border-t border-border pt-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-mono text-xs text-text-faint">
                    {complaint.locationPrecision === "exact" ? "📍 ব্যবহারকারী পিন করা লোকেশন" : "📍 আনুমানিক লোকেশন"}
                  </p>
                  <div className="flex gap-1">
                    <a href={googleMapsLink(complaint.lat, complaint.lng)} target="_blank" rel="noopener noreferrer"
                      className="rounded-md border border-border px-2 py-0.5 font-mono text-[10px] text-text-muted hover:text-accent hover:border-accent/40 transition-colors">Google Maps ↗</a>
                    <a href={osmMapsLink(complaint.lat, complaint.lng)} target="_blank" rel="noopener noreferrer"
                      className="rounded-md border border-border px-2 py-0.5 font-mono text-[10px] text-text-muted hover:text-accent hover:border-accent/40 transition-colors">OSM ↗</a>
                    {(complaint.locationPrecision === "exact" || complaint.locationPrecision === "street") && (
                      <button type="button" onClick={() => setShow3D(true)}
                        className="rounded-md border border-accent/40 bg-accent-soft/40 px-2 py-0.5 font-mono text-[10px] text-accent hover:bg-accent hover:text-bg transition-colors">⛰ ৩ডি ভিউ</button>
                    )}
                  </div>
                </div>
                <MapView items={[{
                  id: complaint.id, caseId: complaint.caseId, type: complaint.type, title: complaint.title,
                  summary: complaint.description ? complaint.description.substring(0, 120) : "",
                  location: complaint.location, lat: complaint.lat, lng: complaint.lng,
                  locationPrecision: complaint.locationPrecision || "district", publishedAt: complaint.publishedAt || complaint.createdAt,
                }]} activeCaseId={complaint.caseId} height={320} />
              </div>
            )}

            {complaint.proofs && complaint.proofs.length > 0 ? (
              <ProofsViewer proofs={complaint.proofs} complaintId={complaint.caseId} />
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
                <textarea className="field-input min-h-[110px] resize-y" value={publicSummary}
                  onChange={(e) => setPublicSummary(e.target.value)}
                  placeholder="যেমন: এলাকায় একটি চুরির ঘটনা রিপোর্ট হয়েছে এবং স্থানীয় প্রশাসনকে জানানো হয়েছে।" />
              </div>
              <div>
                <label className="field-label">প্রত্যাখ্যানের কারণ (ঐচ্ছিক)</label>
                <input className="field-input" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
              </div>
              {complaint.status !== "published" && complaint.proofs && complaint.proofs.length > 0 && (
                <div className="flex items-start gap-3 rounded-md border border-border p-3">
                  <input id="proofsVisible" type="checkbox" checked={proofsVisible}
                    onChange={(e) => setProofsVisible(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-borderStrong bg-elevated text-accent focus:ring-accent/40" />
                  <div>
                    <label htmlFor="proofsVisible" className="cursor-pointer font-code text-sm font-medium text-text-primary">প্রমাণ প্রকাশ করুন</label>
                    <p className="mt-0.5 font-code text-xs text-text-muted">চেক করলে ব্যবহারকারী তার রিপোর্টের পাবলিক পেজে প্রমাণ (ছবি/ভিডিও) দেখতে পাবেন। ব্যক্তিগত তথ্য থাকলে চেক করবেন না।</p>
                  </div>
                </div>
              )}
            </div>

            {successMsg && <div className="mt-3 rounded-md border border-accent/30 bg-accent-soft/40 px-4 py-3"><p className="font-body text-sm text-accent">{successMsg}</p></div>}
            {error && <div className="mt-3 rounded-md border border-danger/40 bg-danger-soft px-4 py-3"><p className="font-body text-sm text-danger">{error}</p></div>}

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => updateStatus("reviewing")} disabled={saving} className="btn-secondary text-xs relative">
                {saving && actionType === "reviewing" ? <><span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" /> যাচাই চলছে...</> : "যাচাই চলছে চিহ্নিত করুন"}
              </button>
              <button onClick={() => updateStatus("published")} disabled={saving} className="btn-primary text-xs relative">
                {saving && actionType === "published" ? <><span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" /> প্রকাশ হচ্ছে...</> : "প্রকাশ করুন"}
              </button>
              <button onClick={() => updateStatus("rejected")} disabled={saving} className="btn-secondary text-xs !border-danger/40 !text-danger relative">
                {saving && actionType === "rejected" ? <><span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" /> প্রত্যাখ্যান হচ্ছে...</> : "প্রত্যাখ্যান করুন"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <AdminUpdatePanel complaintId={complaint.id} publishedAt={complaint.publishedAt} />
        </div>
      </section>

      {show3D && complaint.lat && complaint.lng && (
        <Map3DModal open={show3D} onClose={() => setShow3D(false)}
          lat={complaint.lat} lng={complaint.lng} caseId={complaint.caseId}
          title={complaint.title} type={complaint.type} />
      )}
    </>
  );
}