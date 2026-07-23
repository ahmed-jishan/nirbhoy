import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useI18n, LanguageToggle } from "../lib/i18n";
import ThemeToggle from "./ThemeToggle";

const NAV_KEYS = [
  { href: "/feed", key: "nav.feed", icon: "📋" },
  { href: "/stats", key: "nav.stats", icon: "📊" },
  { href: "/track", key: "nav.track", icon: "🔍" },
  { href: "/how-it-works", key: "nav.how", icon: "❓" },
  { href: "/safety", key: "nav.safety", icon: "🛡️" },
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
    <header className="border-b border-border bg-bg/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <LanternMark />
          <span className="font-display text-lg font-semibold tracking-tight text-text-primary">
            <span aria-hidden="true" className="inline-block text-text-muted" style={{ transform: "scaleX(-1)", display: "inline-block" }}>N</span>
            <span className="sr-only">N</span>irbhoy
          </span>
        </Link>

        {/* Desktop nav — pill-style tabs */}
        <nav className="hidden md:flex items-center gap-1.5 rounded-[10px] bg-elevated/60 p-1.5 font-body text-sm">
          {NAV_KEYS.map(({ href, key, icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-bg text-text-primary border border-borderStrong shadow-sm"
                    : "text-text-muted hover:text-text-primary hover:bg-elevated2/50 border border-transparent"
                }`}
              >
                <span className="text-[13px]" aria-hidden="true">{icon}</span>
                <span>{t(key)}</span>
              </Link>
            );
          })}
          <Link href="/submit" className="btn-secondary ml-1 !px-3.5 !py-2 !text-sm">
            {t("nav.submit")}
          </Link>
          <div className="flex items-center gap-0.5 pl-1.5 border-l border-border ml-1">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </nav>

        {/* Mobile hamburger */}
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

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-elevated">
          <nav className="flex flex-col gap-1 px-6 py-4">
            {NAV_KEYS.map(({ href, key, icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`inline-flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-bg text-text-primary border border-borderStrong"
                      : "text-text-muted hover:text-text-primary hover:bg-elevated2/50 border border-transparent"
                  }`}
                >
                  <span className="text-[15px]" aria-hidden="true">{icon}</span>
                  <span>{t(key)}</span>
                </Link>
              );
            })}
            <Link href="/submit" className="btn-secondary mt-2" onClick={() => setMenuOpen(false)}>
              {t("nav.submit")}
            </Link>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="font-terminal text-[10px] uppercase tracking-widest text-text-faint">
                {t("nav.language")}
              </span>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <LanguageToggle />
              </div>
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