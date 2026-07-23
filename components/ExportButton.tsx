import { useState } from "react";

/**
 * "CSV ডাউনলোড" button.
 *
 * Hits GET /api/export/csv with the given dataset + filter params and streams
 * the response down as a file download. We fetch as a blob (rather than just
 * pointing the browser at the URL) so we can show a loading state and surface
 * errors inline instead of navigating away.
 */

interface ExportButtonProps {
  /** Which dataset to export — matches the API's `dataset` param. */
  dataset: "feed" | "stats";
  /** Extra filter params forwarded to the API (feed filters, etc.). */
  params?: Record<string, string>;
  /** Optional label override. */
  label?: string;
  className?: string;
}

export default function ExportButton({
  dataset,
  params = {},
  label = "CSV ডাউনলোড",
  className = "",
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDownload() {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ dataset, ...params });
      const res = await fetch(`/api/export/csv?${qs.toString()}`);
      if (!res.ok) {
        let msg = "ডাউনলোড ব্যর্থ হয়েছে।";
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {
          /* non-JSON error body — keep the default message */
        }
        throw new Error(msg);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // Derive a sensible filename from the Content-Disposition header, else
      // fall back to a dataset-stamped default.
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : `nirbhoy-${dataset}.csv`;

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message || "ডাউনলোড ব্যর্থ হয়েছে।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 rounded-none border border-borderStrong px-3 py-1.5 font-terminal text-xs tracking-wider text-text-muted transition-colors hover:border-accent/60 hover:text-accent disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
        title="বর্তমান ফিল্টার অনুযায়ী CSV হিসেবে ডাউনলোড করুন"
      >
        {loading ? (
          <span className="animate-pulse">$ তৈরি হচ্ছে...</span>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M7 1V9M7 9L4 6M7 9L10 6M2 11V12.5H12V11"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {label}
          </>
        )}
      </button>
      {error && (
        <span className="font-terminal text-[10px] text-danger">
          [!] {error}
        </span>
      )}
    </div>
  );
}