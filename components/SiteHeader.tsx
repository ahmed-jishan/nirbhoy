import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useI18n, LanguageToggle } from "../lib/i18n";

const NAV_KEYS = [
  { href: "/feed", key: "nav.feed" },
  { href: "/track", key: "nav.track" },
  { href: "/how-it-works", key: "nav.how" },
  { href: "/safety", key: "nav.safety" },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  function isActive(href) {
    if (href === "/") return router.pathname === "/";
    return router.pathname.startsWith(href);
  }

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2 group">
          <LanternMark />
          <span className="font-display text-lg font-semibold tracking-tight text-text-primary group-hover:animate-glitch">
            <span
              aria-hidden="true"
              className="inline-block text-text-muted transition-transform duration-300 group-hover:[transform:scaleX(1)]"
              style={{ transform: "scaleX(-1)", transformOrigin: "center" }}
            >
              N
            </span>
            <span className="sr-only">N</span>irbhoy
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 font-body text-sm">
          {NAV_KEYS.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              className={`relative font-mono text-xs tracking-wider px-3 py-2 transition-all duration-200 ${
                isActive(href)
                  ? "text-accent after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:bg-accent after:rounded-full after:shadow-[0_0_6px_rgba(13,148,136,0.5)]"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {'>'} {t(key)}
            </Link>
          ))}
          <Link href="/submit" className="btn-secondary ml-2 !px-4 !py-2">
            {t("nav.submit")}
          </Link>
          <LanguageToggle className="ml-2" />
        </nav>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden rounded-md p-2 text-text-muted hover:text-text-primary transition-colors"
          aria-label={t("nav.menu")}
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
            {NAV_KEYS.map(({ href, key }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`w-full justify-start font-mono px-3 py-2 rounded-md transition-all duration-200 ${
                  isActive(href)
                    ? "text-accent bg-accent-soft/60 border-l-2 border-accent"
                    : "text-text-muted hover:text-text-primary hover:bg-elevated2"
                }`}
              >
                {'>'} {t(key)}
              </Link>
            ))}
            <Link href="/submit" className="btn-secondary w-full mt-2" onClick={() => setMenuOpen(false)}>
              {t("nav.submit")}
            </Link>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="font-terminal text-[10px] uppercase tracking-widest text-text-faint">
                {t("nav.language")}
              </span>
              <LanguageToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export function LanternMark({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#0D9488" fillOpacity="0.12" />
      <path
        d="M12 5.5c-2 0-3.4 1.6-3.4 3.4 0 1.5.9 2.4 1.4 3.3.4.7.7 1.4.7 2.3v1h2.6v-1c0-.9.3-1.6.7-2.3.5-.9 1.4-1.8 1.4-3.3 0-1.8-1.4-3.4-3.4-3.4Z"
        fill="#0D9488"
      />
      <rect x="10.6" y="16.5" width="2.8" height="1.4" rx="0.3" fill="#0D9488" />
    </svg>
  );
}
