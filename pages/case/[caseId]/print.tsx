import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

/**
 * Print-friendly case page — the "PDF export" is achieved by loading this
 * clean, minimal layout and letting the browser's built-in Print → Save as
 * PDF dialog do the actual generation.
 *
 * This avoids shipping a heavy server-side PDF library while still giving
 * users a professional, downloadable case document.
 */

const TYPE_LABEL: Record<string, string> = {
  incident: "অপরাধ / ঘটনা (Incident)",
  grievance: "সাধারণ অভিযোগ (Grievance)",
};

const UPDATE_TYPE_LABEL: Record<string, string> = {
  info: "তথ্য",
  action: "পদক্ষেপ",
  resolved: "সমাধান",
  escalated: "এসকেলেট",
};

export default function CasePrint() {
  const router = useRouter();
  const { caseId } = router.query;
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!caseId || typeof caseId !== "string") return;
    fetch(`/api/case/${encodeURIComponent(caseId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d.case);
        // Auto-open the print dialog once content is rendered.
        setTimeout(() => window.print(), 400);
      })
      .catch((e) => setError(e.message));
  }, [caseId]);

  return (
    <>
      <Head>
        <title>{data ? `${data.caseId} — PDF` : "PDF"} — Nirbhoy</title>
        <meta name="robots" content="noindex" />
      </Head>

      {/* Inline print stylesheet so this page is fully self-contained.
          Uses plain CSS (not Tailwind) so it prints cleanly regardless
          of what the rest of the app does with backgrounds/dark mode. */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }
          .no-print {
            display: none !important;
          }
          body {
            background: #fff !important;
            color: #111 !important;
          }
        }
        body {
          background: #f9fafb;
          color: #111;
          font-family: system-ui, -apple-system, sans-serif;
          line-height: 1.5;
          margin: 0;
        }
        .paper {
          max-width: 800px;
          margin: 24px auto;
          padding: 40px 48px;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }
        .header {
          border-bottom: 2px solid #0d9488;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .brand {
          font-size: 12px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #0d9488;
          font-weight: 600;
        }
        .case-id {
          font-family: ui-monospace, monospace;
          font-size: 14px;
          background: #f0fdfa;
          border: 1px solid #99f6e4;
          padding: 4px 10px;
          display: inline-block;
          margin-top: 8px;
          color: #0f766e;
        }
        h1 {
          font-size: 22px;
          margin: 12px 0 0;
          font-weight: 600;
        }
        h2 {
          font-size: 15px;
          margin: 24px 0 8px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #374151;
        }
        .meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          font-size: 13px;
          margin-top: 16px;
        }
        .meta dt {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #6b7280;
          margin-bottom: 2px;
        }
        .meta dd {
          margin: 0;
          color: #111;
        }
        p.summary {
          font-size: 13px;
          line-height: 1.65;
          color: #374151;
          white-space: pre-wrap;
        }
        .timeline {
          list-style: none;
          padding: 0;
          margin: 8px 0 0;
        }
        .timeline-item {
          border-left: 2px solid #d1d5db;
          padding: 4px 0 12px 16px;
          margin-left: 4px;
          position: relative;
          font-size: 12px;
        }
        .timeline-item::before {
          content: "";
          position: absolute;
          left: -5px;
          top: 8px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #0d9488;
        }
        .timeline-item .type {
          display: inline-block;
          font-size: 9px;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 2px 6px;
          border: 1px solid #99f6e4;
          color: #0f766e;
          margin-right: 6px;
        }
        .timeline-item .date {
          font-size: 10px;
          color: #6b7280;
        }
        .timeline-item .title {
          font-weight: 600;
          font-size: 13px;
          margin-top: 4px;
        }
        .timeline-item .msg {
          margin-top: 2px;
          color: #374151;
          white-space: pre-wrap;
        }
        .footer {
          margin-top: 40px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
          font-size: 10px;
          color: #6b7280;
          text-align: center;
        }
        .controls {
          text-align: center;
          margin: 24px 0;
        }
        .controls button {
          background: #0d9488;
          color: #fff;
          border: none;
          padding: 10px 20px;
          font-size: 14px;
          cursor: pointer;
          border-radius: 4px;
        }
      `}</style>

      {error && (
        <div className="paper no-print">
          <p style={{ color: "#dc2626" }}>[!] {error}</p>
        </div>
      )}

      {data && (
        <>
          <div className="controls no-print">
            <button type="button" onClick={() => window.print()}>
              🖨 প্রিন্ট / PDF হিসেবে সেভ করুন
            </button>
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
              ব্রাউজারের প্রিন্ট ডায়ালগ খুলবে। &ldquo;Save as PDF&rdquo; নির্বাচন করুন।
            </p>
          </div>

          <div className="paper">
            <div className="header">
              <div className="brand">Nirbhoy — Anonymous Civic Complaint</div>
              <h1>{data.title}</h1>
              <div className="case-id">$ {data.caseId}</div>
            </div>

            <dl className="meta">
              <div>
                <dt>ধরন / Type</dt>
                <dd>{TYPE_LABEL[data.type] || data.type}</dd>
              </div>
              <div>
                <dt>স্ট্যাটাস / Status</dt>
                <dd>প্রকাশিত (Published)</dd>
              </div>
              <div>
                <dt>স্থান / Location</dt>
                <dd>{data.location || "—"}</dd>
              </div>
              <div>
                <dt>প্রকাশের তারিখ / Published</dt>
                <dd>
                  {data.publishedAt
                    ? new Date(data.publishedAt).toLocaleDateString("bn-BD")
                    : "—"}
                </dd>
              </div>
              {data.lat && data.lng && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <dt>স্থানাঙ্ক / Coordinates</dt>
                  <dd style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}>
                    LAT {data.lat.toFixed(6)} · LNG {data.lng.toFixed(6)}
                  </dd>
                </div>
              )}
            </dl>

            <h2>সারাংশ / Summary</h2>
            <p className="summary">{data.summary || "সারাংশ পাওয়া যায়নি।"}</p>

            {data.updates && data.updates.length > 0 && (
              <>
                <h2>টাইমলাইন / Timeline</h2>
                <ul className="timeline">
                  {data.updates.map((u: any) => (
                    <li key={u.id} className="timeline-item">
                      <span className="type">
                        {UPDATE_TYPE_LABEL[u.type] || u.type}
                      </span>
                      <span className="date">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleString("bn-BD")
                          : ""}
                      </span>
                      <div className="title">{u.title}</div>
                      <div className="msg">{u.message}</div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="footer">
              এই ডকুমেন্টটি Nirbhoy থেকে {new Date().toLocaleDateString("bn-BD")} তারিখে
              তৈরি করা হয়েছে। কেসের সর্বশেষ অবস্থা যাচাই করতে ভিজিট করুন: /case/{data.caseId}
            </div>
          </div>
        </>
      )}
    </>
  );
}
