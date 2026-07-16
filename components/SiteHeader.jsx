import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <LanternMark />
          <span className="font-display text-lg font-semibold tracking-tight text-text-primary">
            Nirbhoy
          </span>
        </Link>
        <nav className="flex items-center gap-1 font-body text-sm">
          <Link href="/feed" className="btn-ghost">
            জনসাধারণের ফিড
          </Link>
          <Link href="/track" className="btn-ghost">
            স্ট্যাটাস দেখুন
          </Link>
          <Link href="/how-it-works" className="btn-ghost">
            কীভাবে কাজ করে
          </Link>
          <Link href="/submit" className="btn-primary ml-2 !px-4 !py-2">
            রিপোর্ট করুন
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function LanternMark({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#E8A33D" fillOpacity="0.12" />
      <path
        d="M12 5.5c-2 0-3.4 1.6-3.4 3.4 0 1.5.9 2.4 1.4 3.3.4.7.7 1.4.7 2.3v1h2.6v-1c0-.9.3-1.6.7-2.3.5-.9 1.4-1.8 1.4-3.3 0-1.8-1.4-3.4-3.4-3.4Z"
        fill="#E8A33D"
      />
      <rect x="10.6" y="16.5" width="2.8" height="1.4" rx="0.3" fill="#E8A33D" />
    </svg>
  );
}
