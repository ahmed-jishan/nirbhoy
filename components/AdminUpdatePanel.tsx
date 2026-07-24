import { useEffect, useState } from "react";
import CaseTimeline from "./CaseTimeline";

/**
 * AdminUpdatePanel — moderator-facing panel used in the review page to
 * add / delete case updates. Handles its own fetching so the parent
 * review page stays lean.
 */

interface Update {
  id: string;
  title: string;
  message: string;
  type: string;
  isPublic: boolean;
  authorEmail: string | null;
  createdAt: string | null;
}

const TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "info", label: "তথ্য (সাধারণ)" },
  { value: "action", label: "পদক্ষেপ নেওয়া হয়েছে" },
  { value: "resolved", label: "সমাধান হয়েছে" },
  { value: "escalated", label: "উচ্চ কর্তৃপক্ষে পাঠানো" },
];

export default function AdminUpdatePanel({
  complaintId,
  publishedAt,
}: {
  complaintId: string;
  publishedAt: string | null;
}) {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [isPublic, setIsPublic] = useState(true);

  async function loadUpdates() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/complaints/${complaintId}/updates`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "লোড করা যায়নি");
      setUpdates(data.updates || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!complaintId) return;
    loadUpdates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaintId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3 || message.trim().length < 5) {
      setError("শিরোনাম ও বার্তা যথেষ্ট লম্বা করুন।");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/complaints/${complaintId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, type, isPublic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "যোগ করা যায়নি");
      // Reset form and refresh
      setTitle("");
      setMessage("");
      setType("info");
      setIsPublic(true);
      await loadUpdates();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("এই আপডেটটি মুছে ফেলবেন?")) return;
    try {
      const res = await fetch(
        `/api/admin/complaints/${complaintId}/updates?updateId=${id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await loadUpdates();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="card !p-4 sm:!p-6">
      <h3 className="font-display text-sm sm:text-base font-medium text-text-primary">
        কেস টাইমলাইন / আপডেট
      </h3>
      <p className="mt-1 font-body text-xs text-text-muted">
        পাবলিক আপডেট সবাই দেখতে পাবেন। প্রাইভেট আপডেট শুধু মডারেটরদের জন্য।
      </p>

      {/* Add update form */}
      <form onSubmit={handleSubmit} className="mt-5 space-y-3 border-t border-border pt-5">
        <div>
          <label className="field-label !text-xs !mb-1">শিরোনাম</label>
          <input
            className="field-input"
            value={title}
            maxLength={140}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="যেমন: স্থানীয় থানায় জানানো হয়েছে"
          />
        </div>

        <div>
          <label className="field-label !text-xs !mb-1">বার্তা</label>
          <textarea
            className="field-input min-h-[80px] sm:min-h-[90px] resize-y"
            value={message}
            maxLength={2000}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="বিস্তারিত লিখুন — কোনো নাম বা শনাক্তযোগ্য তথ্য নয়।"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label !text-xs !mb-1">ধরন</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="field-input"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label !text-xs !mb-1">দৃশ্যমানতা</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex-1 rounded-md border px-3 py-2 font-terminal text-xs transition-colors ${
                  isPublic
                    ? "border-accent/60 bg-accent-soft/40 text-accent"
                    : "border-borderStrong text-text-muted hover:text-text-primary"
                }`}
              >
                পাবলিক
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex-1 rounded-md border px-3 py-2 font-terminal text-xs transition-colors ${
                  !isPublic
                    ? "border-danger/40 bg-danger-soft/40 text-danger"
                    : "border-borderStrong text-text-muted hover:text-text-primary"
                }`}
              >
                প্রাইভেট
              </button>
            </div>
          </div>
        </div>

        {error && (
          <p className="rounded-md border border-danger/40 bg-danger-soft px-3 py-2 font-code text-xs text-danger">
            <span className="term-err">[!]</span> {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary text-xs w-full sm:w-auto">
          {submitting ? "$ যোগ করা হচ্ছে..." : "$ আপডেট যোগ করুন"}
        </button>
      </form>

      {/* Timeline */}
      <div className="mt-6 border-t border-border pt-5">
        <p className="font-terminal text-xs text-text-faint">
          $ মোট {updates.length}টি আপডেট
        </p>
        <div className="mt-4">
          {loading ? (
            <p className="font-terminal text-xs text-text-muted animate-pulse">
              $ loading updates...
            </p>
          ) : (
            <CaseTimeline
              updates={updates}
              publishedAt={publishedAt}
              showPrivate
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
}