import { useState } from "react";
import Link from "next/link";

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2 group">
          <LanternMark />
          <span className="font-display text-lg font-semibold tracking-tight text-text-primary group-hover:animate-glitch">
            Nirbhoy
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 font-body text-sm">
          <Link href="/feed" className="btn-ghost font-mono text-xs tracking-wider">
            {'>'} ফিড
          </Link>
          <Link href="/track" className="btn-ghost font-mono text-xs tracking-wider">
            {'>'} স্ট্যাটাস
          </Link>
          <Link href="/how-it-works" className="btn-ghost font-mono text-xs tracking-wider">
            {'>'} কীভাবে
          </Link>
          <Link href="/submit" className="btn-secondary ml-2 !px-4 !py-2">
            [ রিপোর্ট করুন ]
          </Link>
        </nav>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden rounded-md p-2 text-text-muted hover:text-text-primary transition-colors"
          aria-label="মেনু"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-elevated">
          <nav className="flex flex-col gap-1 px-6 py-4 font-body text-sm">
            <Link href="/feed" className="btn-ghost w-full justify-start font-mono" onClick={() => setMenuOpen(false)}>
              {'>'} জনসাধারণের ফিড
            </Link>
            <Link href="/track" className="btn-ghost w-full justify-start font-mono" onClick={() => setMenuOpen(false)}>
              {'>'} স্ট্যাটাস দেখুন
            </Link>
            <Link href="/how-it-works" className="btn-ghost w-full justify-start font-mono" onClick={() => setMenuOpen(false)}>
              {'>'} কীভাবে কাজ করে
            </Link>
            <Link href="/submit" className="btn-secondary w-full mt-2" onClick={() => setMenuOpen(false)}>
              [ রিপোর্ট করুন ]
            </Link>
          </nav>
        </div>
      )}
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