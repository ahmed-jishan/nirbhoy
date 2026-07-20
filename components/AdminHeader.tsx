import Link from "next/link";
import { useRouter } from "next/router";
import { LanternMark } from "./SiteHeader";

const ADMIN_NAV = [
  { href: "/admin", label: "অপেক্ষমাণ", exact: true },
  { href: "/admin/published", label: "প্রকাশিত" },
  { href: "/admin/stats", label: "পরিসংখ্যান" },
];

export default function AdminHeader({ email }) {
  const router = useRouter();

  function isActive(href, exact) {
    if (exact) return router.pathname === href;
    return router.pathname.startsWith(href);
  }

  async function handleLogout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.push("/admin/login");
  }

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2">
            <LanternMark size={20} />
            <span className="font-display text-base font-semibold text-text-primary">Nirbhoy</span>
            <span className="font-terminal text-xs text-accent">/ প্যানেল</span>
          </Link>
          <nav className="flex items-center gap-1 font-mono text-xs">
            {ADMIN_NAV.map(({ href, label, exact }) => (
              <Link
                key={href}
                href={href}
                className={`relative px-3 py-2 transition-all duration-200 ${
                  isActive(href, exact)
                    ? "text-accent after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:bg-accent after:rounded-full after:shadow-[0_0_6px_rgba(13,148,136,0.5)]"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {'>'} {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {email && <span className="font-code text-xs text-text-faint">{email}</span>}
          <button onClick={handleLogout} className="btn-secondary !px-3 !py-1.5 text-xs">
            লগআউট
          </button>
        </div>
      </div>
    </header>
  );
}
