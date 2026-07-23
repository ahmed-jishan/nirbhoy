import { useEffect, useState } from "react";
import { useI18n } from "../lib/i18n";
import { getBrowserFingerprint } from "../lib/fingerprint";

/**
 * UpvoteButton — anonymous, one-click upvote for a published case.
 *
 * Two-layer anti-gaming:
 *  1. Voter token — random UUID stored in localStorage. Survives page reloads.
 *  2. Browser fingerprint — lightweight hash of non-identifying browser
 *     signals (screen size, timezone, platform, language, user agent).
 *     This survives localStorage clears and different incognito tabs.
 *
 * Both are sent to the server and combined in a SHA-256 hash to form a
 * deterministic voteId. The raw token and fingerprint are NEVER stored.
 */

const TOKEN_KEY = "nirbhoy:voter-token";

function getOrCreateToken(): string {
  if (typeof window === "undefined") return "";
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    // Prefer crypto.randomUUID, fall back to a Math.random-based UUID
    // for older browsers.
    token =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : "v-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

/** Fingerprint is computed once and cached across re-renders. */
function getFingerprint(): string {
  return getBrowserFingerprint();
}

export default function UpvoteButton({
  caseId,
  initialCount,
}: {
  caseId: string;
  initialCount: number;
}) {
  const { t } = useI18n();
  const [count, setCount] = useState<number>(initialCount);
  const [voted, setVoted] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // On mount, sync the "voted" state from the server (only if we have a
  // token — first-time visitors get the default `false`).
  useEffect(() => {
    const token = getOrCreateToken();
    if (!token) return;
    const fp = getFingerprint();
    const params = new URLSearchParams({ token });
    if (fp) params.set("fingerprint", fp);
    fetch(
      `/api/case/${encodeURIComponent(caseId)}/vote?${params.toString()}`
    )
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.count === "number") setCount(d.count);
        if (typeof d.voted === "boolean") setVoted(d.voted);
      })
      .catch(() => {
        /* silent — button still works via POST */
      });
  }, [caseId]);

  async function handleClick() {
    if (busy) return;
    const token = getOrCreateToken();
    if (!token) return;

    // Optimistic update — feels instant, we correct on server response.
    const prevCount = count;
    const prevVoted = voted;
    setCount((c) => (voted ? Math.max(0, c - 1) : c + 1));
    setVoted((v) => !v);

    setBusy(true);
    setError("");
    try {
      const fp = getFingerprint();
      const res = await fetch(`/api/case/${encodeURIComponent(caseId)}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, fingerprint: fp || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Vote failed");
      setCount(data.count);
      setVoted(Boolean(data.voted));
    } catch (e: any) {
      // Roll back on failure
      setCount(prevCount);
      setVoted(prevVoted);
      setError(e.message || t("vote.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex flex-col">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-pressed={voted}
        title={voted ? t("vote.titleUnmark") : t("vote.titleMark")}
        className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 font-terminal text-xs transition-colors ${
          voted
            ? "border-accent/60 bg-accent-soft text-accent"
            : "border-borderStrong bg-elevated/80 text-text-muted hover:border-accent/40 hover:text-accent"
        } disabled:opacity-50`}
      >
        <span aria-hidden="true">{voted ? "▲" : "△"}</span>
        <span>
          {voted ? t("vote.supported") : t("vote.support")} · {count}
        </span>
      </button>
      {error && (
        <span className="mt-1 font-terminal text-[10px] text-danger">{error}</span>
      )}
    </div>
  );
}
