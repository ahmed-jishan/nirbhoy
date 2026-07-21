import Head from "next/head";
import Link from "next/link";

/**
 * Offline fallback page — served by the service worker when the user has
 * no internet connection and the requested page isn't cached.
 */
export default function OfflinePage() {
  return (
    <>
      <Head>
        <title>অফলাইন — Nirbhoy</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-center">
        {/* Lantern icon */}
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="11" fill="#0D9488" fillOpacity="0.15" />
          <path
            d="M12 5.5c-2 0-3.4 1.6-3.4 3.4 0 1.5.9 2.4 1.4 3.3.4.7.7 1.4.7 2.3v1h2.6v-1c0-.9.3-1.6.7-2.3.5-.9 1.4-1.8 1.4-3.3 0-1.8-1.4-3.4-3.4-3.4Z"
            fill="#0D9488"
          />
          <rect x="10.6" y="16.5" width="2.8" height="1.4" rx="0.3" fill="#0D9488" />
        </svg>

        <h1 className="mt-6 font-display text-2xl font-semibold text-text-primary">
          ইন্টারনেট সংযোগ নেই
        </h1>
        <p className="mt-3 max-w-sm font-code text-sm leading-relaxed text-text-muted">
          আপনার ডিভাইসটি বর্তমানে অফলাইন আছে। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করুন
          এবং আবার চেষ্টা করুন।
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            $ আবার চেষ্টা করুন
          </button>
          <Link href="/" className="btn-ghost">
            {'>'} হোমে ফিরে যান
          </Link>
        </div>

        <p className="mt-12 font-terminal text-xs text-text-faint">
          <span className="term-info">$</span> একবার ভিজিট করা পেজ অফলাইনেও দেখা যাবে
        </p>
      </div>
    </>
  );
}