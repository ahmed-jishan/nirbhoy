import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { getTurnstileSiteKey } from "../lib/captcha";

const MAX_TOTAL_MB = 30;
const MAX_TOTAL_BYTES = MAX_TOTAL_MB * 1024 * 1024;
const MAX_FILES = 10;

async function uploadSingleFile(file, setFileProgress) {
  const sigRes = await fetch("/api/upload-signature", { method: "POST" });
  if (!sigRes.ok) throw new Error("Could not prepare the file upload.");
  const sig = await sigRes.json();

  const resourceType = file.type.startsWith("video/") ? "video" : "image";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", sig.apiKey);
  formData.append("timestamp", sig.timestamp);
  formData.append("signature", sig.signature);
  formData.append("public_id", sig.publicId);
  formData.append("folder", sig.folder);
  formData.append("type", sig.type);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${sig.cloudName}/${resourceType}/upload`;

  const result = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setFileProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
      else reject(new Error("File upload failed."));
    };
    xhr.onerror = () => reject(new Error("File upload failed."));
    xhr.send(formData);
  });

  return { publicId: result.public_id, resourceType };
}

export default function Submit() {
  const [type, setType] = useState("incident");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [files, setFiles] = useState([]);
  const [fileProgress, setFileProgress] = useState({});
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [caseId, setCaseId] = useState(null);
  const [captchaToken, setCaptchaToken] = useState(null);
  const captchaRef = useRef(null);
  const turnstileSiteKey = getTurnstileSiteKey();

  function handleFileChange(e) {
    setError("");
    const selected = Array.from(e.target.files || []);

    // Check total count
    if (files.length + selected.length > MAX_FILES) {
      setError(`সর্বোচ্চ ${MAX_FILES}টি ফাইল আপলোড করা যাবে।`);
      e.target.value = "";
      return;
    }

    // Check total size
    const existingSize = files.reduce((sum, f) => sum + f.size, 0);
    const newSize = selected.reduce((sum, f) => sum + f.size, 0);
    if (existingSize + newSize > MAX_TOTAL_BYTES) {
      setError(`সব ফাইলের মোট আকার ${MAX_TOTAL_MB}MB এর কম হতে হবে।`);
      e.target.value = "";
      return;
    }

    setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + "B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "KB";
    return (bytes / (1024 * 1024)).toFixed(1) + "MB";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (title.trim().length < 4) return setError("অনুগ্রহ করে একটি শিরোনাম লিখুন (কমপক্ষে ৪ অক্ষর)।");
    if (description.trim().length < 20) return setError("অনুগ্রহ করে বিস্তারিত লিখুন (কমপক্ষে ২০ অক্ষর)।");

    setSubmitting(true);
    setUploading(true);
    try {
      // Upload all files sequentially with per-file progress
      const proofs = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setFileProgress((prev) => ({ ...prev, [i]: 0 }));
        const { publicId, resourceType } = await uploadSingleFile(file, (pct) => {
          setFileProgress((prev) => ({ ...prev, [i]: pct }));
        });
        proofs.push({ publicId, resourceType });
        setFileProgress((prev) => ({ ...prev, [i]: 100 }));
      }
      setUploading(false);

      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          description,
          location,
          proofs,
          captchaToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "জমা দেওয়া যায়নি।");

      setCaseId(data.caseId);
    } catch (err) {
      setError(err.message || "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      setUploading(false);
    } finally {
      setSubmitting(false);
    }
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  if (caseId) {
    return (
      <>
        <Head><title>জমা সম্পন্ন — Nirbhoy</title></Head>
        <SiteHeader />
        <section className="mx-auto max-w-lg px-6 py-24 text-center">
          <p className="font-mono text-xs uppercase tracking-wider text-text-faint">সফলভাবে জমা হয়েছে</p>
          <div className="case-stamp mt-6 !inline-flex text-base">{caseId}</div>
          <h1 className="mt-6 font-display text-2xl font-semibold text-text-primary">
            এই কেস নম্বরটি সংরক্ষণ করুন
          </h1>
          <p className="mt-3 font-body text-sm leading-relaxed text-text-muted">
            আমরা কোনো লগইন বা পরিচয় সংরক্ষণ করি না, তাই এই নম্বরটিই ভবিষ্যতে অবস্থা যাচাইয়ের একমাত্র
            উপায়। এটি স্ক্রিনশট নিয়ে রাখুন বা লিখে রাখুন।
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <a href="/track" className="btn-primary">স্ট্যাটাস যাচাই করুন</a>
            <a href="/" className="btn-ghost">হোমে ফিরে যান</a>
          </div>
        </section>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <Head><title>রিপোর্ট জমা দিন — Nirbhoy</title></Head>
      <SiteHeader />

      <section className="mx-auto max-w-xl px-6 py-14">
        <h1 className="font-display text-3xl font-semibold text-text-primary">রিপোর্ট জমা দিন</h1>
        <p className="mt-3 font-body text-sm text-text-muted">
          কোনো অ্যাকাউন্ট লাগবে না। আপনার নাম বা পরিচয় সংরক্ষণ করা হয় না।
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-7">
          <div>
            <span className="field-label">ধরন</span>
            <div className="grid grid-cols-2 gap-3">
              <TypeOption
                label="অপরাধ / ঘটনা"
                hint="যেমন চুরি, সহিংসতা — যা কর্তৃপক্ষকে জানানো দরকার"
                active={type === "incident"}
                onClick={() => setType("incident")}
              />
              <TypeOption
                label="সাধারণ অভিযোগ"
                hint="যেমন সেবা, দুর্নীতি, অব্যবস্থাপনা নিয়ে অসন্তোষ"
                active={type === "grievance"}
                onClick={() => setType("grievance")}
              />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="title">শিরোনাম</label>
            <input
              id="title"
              className="field-input"
              value={title}
              maxLength={140}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="সংক্ষেপে কী ঘটেছে"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="description">বিস্তারিত বিবরণ</label>
            <textarea
              id="description"
              className="field-input min-h-[140px] resize-y"
              value={description}
              maxLength={4000}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="কী হয়েছে, কখন হয়েছে, বিস্তারিত লিখুন। নিজের নাম উল্লেখ করার প্রয়োজন নেই।"
            />
            <p className="field-hint">{description.length}/4000</p>
          </div>

          <div>
            <label className="field-label" htmlFor="location">স্থান (ঐচ্ছিক)</label>
            <input
              id="location"
              className="field-input"
              value={location}
              maxLength={200}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="যেমন: গ্রামের নাম বা এলাকা (সঠিক ঠিকানা না দিলেও চলবে)"
            />
          </div>

          <div>
            <label className="field-label">প্রমাণ (ঐচ্ছিক — ছবি ও ভিডিও)</label>
            <input
              id="file"
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="field-input file:mr-4 file:rounded file:border-0 file:bg-elevated2 file:px-3 file:py-1.5 file:font-body file:text-sm file:text-text-primary"
              disabled={files.length >= MAX_FILES}
            />
            <p className="field-hint">
              একাধিক ছবি/ভিডিও নির্বাচন করুন। মোট আকার সর্বোচ্চ {MAX_TOTAL_MB}MB (সর্বোচ্চ {MAX_FILES}টি ফাইল)।
              ফাইল প্রাইভেট থাকে — শুধুমাত্র যাচাইকারী মডারেটর দেখতে পারবেন।
            </p>

            {/* File list with individual progress */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-text-faint">
                    {files.length}টি ফাইল · মোট {formatFileSize(totalSize)} / {MAX_TOTAL_MB}MB
                  </span>
                </div>
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-md border border-border bg-elevated p-3">
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-body text-sm text-text-primary">{file.name}</p>
                      <p className="font-mono text-xs text-text-faint">{formatFileSize(file.size)}</p>
                      {(submitting || uploading) && (
                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-elevated2">
                          <div
                            className="h-full rounded-full bg-amber transition-all duration-300"
                            style={{ width: `${fileProgress[i] || 0}%` }}
                          />
                        </div>
                      )}
                    </div>
                    {!submitting && !uploading && (
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="shrink-0 rounded p-1 text-text-faint hover:text-danger transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                    {uploading && fileProgress[i] === 100 && (
                      <span className="shrink-0 font-mono text-xs text-teal">✓</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cloudflare Turnstile CAPTCHA */}
          {turnstileSiteKey && (
            <div>
              <div
                ref={captchaRef}
                className="cf-turnstile"
                data-sitekey={turnstileSiteKey}
                data-callback={(token) => setCaptchaToken(token)}
                data-theme="dark"
              />
            </div>
          )}

          {error && (
            <p className="rounded-md border border-danger/40 bg-danger-soft px-4 py-3 font-body text-sm text-danger">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting || (turnstileSiteKey && !captchaToken)} className="btn-primary w-full">
            {submitting
              ? uploading
                ? `ফাইল আপলোড হচ্ছে… (${Object.values(fileProgress).filter((p) => p === 100).length}/${files.length})`
                : "জমা হচ্ছে…"
              : "নাম প্রকাশ ছাড়াই জমা দিন"}
          </button>
        </form>
      </section>

      <SiteFooter />
    </>
  );
}

function TypeOption({ label, hint, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border p-4 text-left transition-colors ${
        active ? "border-amber/60 bg-amber-soft/40" : "border-borderStrong bg-elevated hover:border-amber/30"
      }`}
    >
      <p className="font-body text-sm font-semibold text-text-primary">{label}</p>
      <p className="mt-1 font-body text-xs leading-relaxed text-text-muted">{hint}</p>
    </button>
  );
}