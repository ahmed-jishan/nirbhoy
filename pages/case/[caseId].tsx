import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import CaseTimeline from "../../components/CaseTimeline";
import UpvoteButton from "../../components/UpvoteButton";
import { useI18n } from "../../lib/i18n";
import { SkeletonCaseDetail } from "../../components/Skeleton";
import ShareButtons from "../../components/ShareButtons";
import { buildSeoMeta } from "../../lib/seo";

interface CaseDetail {
  id: string;
  caseId: string;
  type: string;
  title: string;
  summary: string;
  location: string;
  lat: number | null;
  lng: number | null;
  locationPrecision: string;
  status: string;
  upvotes: number;
  publishedAt: string | null;
  proofsVisible: boolean;
  proofs: Array<{
    publicId: string;
    resourceType: string;
  }>;
  updates: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    isPublic: boolean;
    authorEmail: string | null;
    createdAt: string | null;
  }>;
}

/** Fetches signed Cloudinary proof URLs and renders them in a gallery. */
function ProofsGallery({ caseId }: { caseId: string }) {
  const { t } = useI18n();
  const [proofUrls, setProofUrls] = useState<Array<{ url: string; resourceType: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/case/${encodeURIComponent(caseId)}/proofs`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && Array.isArray(d.proofs)) setProofUrls(d.proofs);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [caseId]);

  if (loading) {
    return (
      <div className="mt-8 border-t border-border pt-8">
        <h2 className="font-display text-xl font-semibold text-text-primary">
          <span className="text-accent">#</span> প্রমাণ
        </h2>
        <p className="mt-2 font-code text-xs text-text-muted animate-pulse">$ প্রমাণ লোড হচ্ছে...</p>
      </div>
    );
  }

  if (proofUrls.length === 0) return null;

  return (
    <div className="mt-8 border-t border-border pt-8">
      <h2 className="font-display text-xl font-semibold text-text-primary">
        <span className="text-accent">#</span> {t("case.proofs") || "প্রমাণ"}
      </h2>
      <p className="mt-2 font-code text-xs text-text-muted">
        <span className="term-info">$</span> {t("case.proofsIntro") || "এই রিপোর্টের সাথে সংযুক্ত প্রমাণ।"}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {proofUrls.map((proof, i) => (
          <a
            key={i}
            href={proof.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-video overflow-hidden rounded-md border border-border bg-elevated hover:border-accent/60 transition-colors"
          >
            {proof.resourceType === "video" ? (
              <div className="flex h-full w-full items-center justify-center bg-elevated2">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="#7C8BA0">
                  <polygon points="8,5 19,12 8,19" />
                </svg>
              </div>
            ) : (
              <img
                src={proof.url}
                alt={`প্রমাণ ${i + 1}`}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
            )}
            <span className="absolute bottom-1 right-1 rounded bg-bg/80 px-1.5 py-0.5 font-terminal text-[10px] text-text-faint">
              {i + 1}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

/**
 * Public case timeline page — anyone with the caseId can view. Shows only
 * published complaints and public updates. Used both by the user who
 * submitted (via track page) and by anyone sharing the case link.
 */
export default function CasePage() {
  const router = useRouter();
  const { caseId } = router.query;
  const { t, lang } = useI18n();
  const locale = lang === "bn" ? "bn-BD" : "en-US";

  const [data, setData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!caseId || typeof caseId !== "string") return;
    setLoading(true);
    setError("");
    setData(null);

    const controller = new AbortController();
    fetch(`/api/case/${encodeURIComponent(caseId)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d.case);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [caseId]);

  function openPrintView() {
    if (!data) return;
    window.open(
      `/case/${encodeURIComponent(data.caseId)}/print`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  const typeLabel = data
    ? data.type === "incident"
      ? t("case.type.incident")
      : data.type === "grievance"
      ? t("case.type.grievance")
      : data.type
    : "";

  const seoMeta = data
    ? buildSeoMeta({
        title: `${data.caseId}: ${data.title}`,
        description: data.summary || `${data.location} এলাকায় ${data.type === "incident" ? "ঘটনা" : "অভিযোগ"} সম্পর্কে বিস্তারিত জানুন।`,
        url: process.env.NEXT_PUBLIC_SITE_URL
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/case/${data.caseId}`
          : `https://nirbhoy.org/case/${data.caseId}`,
        type: "article",
      })
    : [];

  const seoMetaDefault = buildSeoMeta();

  return (
    <>
      <Head>
        <title>{data ? `${data.caseId} — Nirbhoy` : `${lang === "bn" ? "কেস" : "Case"} — Nirbhoy`}</title>
        {(data ? seoMeta : seoMetaDefault).map((m, i) =>
          m.property
            ? <meta key={`og-${i}`} property={m.property} content={m.content} />
            : <meta key={`meta-${i}`} name={m.name} content={m.content} />
        )}
      </Head>
      <SiteHeader />

      <section className="mx-auto max-w-3xl px-6 py-14">
        {loading && <SkeletonCaseDetail />}

        {error && !loading && (
          <div className="card text-center">
            <p className="font-code text-sm text-danger">
              <span className="term-err">[!]</span> {error}
            </p>
            <Link href="/track" className="btn-secondary mt-4 !inline-flex text-xs">
              {t("case.tryAnother")}
            </Link>
          </div>
        )}

        {data && (
          <>
            <div className="flex items-center gap-3">
              <span className="font-terminal text-sm text-accent">$</span>
              <span className="case-stamp">{data.caseId}</span>
              <span className="badge-published">{typeLabel}</span>
            </div>

            <h1 className="mt-6 font-display text-3xl font-semibold leading-tight text-text-primary">
              {data.title}
            </h1>

            {data.summary && (
              <p className="mt-4 font-code text-sm leading-relaxed text-text-muted">
                {data.summary}
              </p>
            )}

            <dl className="mt-6 grid gap-3 border-t border-border pt-6 font-code text-xs sm:grid-cols-2">
              <div>
                <dt className="font-terminal text-[10px] uppercase tracking-widest text-text-faint">
                  $ {t("case.location")}
                </dt>
                <dd className="mt-1 text-text-primary">
                  {data.location || t("case.locationMissing")}
                </dd>
              </div>
              <div>
                <dt className="font-terminal text-[10px] uppercase tracking-widest text-text-faint">
                  $ {t("case.published")}
                </dt>
                <dd className="mt-1 text-text-primary">
                  {data.publishedAt
                    ? new Date(data.publishedAt).toLocaleDateString(locale)
                    : "—"}
                </dd>
              </div>
            </dl>

            {/* Action row: upvote, share, download, back to feed */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <UpvoteButton caseId={data.caseId} initialCount={data.upvotes || 0} />
              <ShareButtons caseId={data.caseId} title={data.title} />
              <button
                type="button"
                onClick={openPrintView}
                className="btn-secondary !py-2 text-xs"
              >
                📄 {t("case.pdf")}
              </button>
              <Link href="/feed" className="btn-ghost !py-2 text-xs">
                {'>'} {t("case.backToFeed")}
              </Link>
            </div>

            {/* Proofs section — only shown when admin opted in */}
            {data.proofsVisible && data.proofs.length > 0 && (
              <ProofsGallery caseId={data.caseId} />
            )}

            {/* Timeline */}
            <div className="mt-10 border-t border-border pt-8">
              <h2 className="font-display text-xl font-semibold text-text-primary">
                <span className="text-accent">#</span> {t("case.timeline")}
              </h2>
              <p className="mt-2 font-code text-xs text-text-muted">
                <span className="term-info">$</span> {t("case.timelineIntro")}
              </p>

              <div className="mt-6">
                <CaseTimeline updates={data.updates} publishedAt={data.publishedAt} />
              </div>
            </div>
          </>
        )}
      </section>

      <SiteFooter />
    </>
  );
}