import Link from "next/link";
import { useRouter } from "next/router";
import { LanternMark } from "./SiteHeader";

const ADMIN_NAV = [
  { href: "/admin", label: "অপেক্ষমাণ", exact: true, icon: "📋" },
  { href: "/admin/published", label: "প্রকাশিত", icon: "✅" },
  { href: "/admin/stats", label: "পরিসংখ্যান", icon: "📊" },
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
    <header className="border-b border-border bg-bg/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link href="/admin" className="flex items-center gap-2 shrink-0">
            <LanternMark size={20} />
            <span className="font-display text-base font-semibold text-text-primary">Nirbhoy</span>
            <span className="font-terminal text-xs text-accent">/ প্যানেল</span>
          </Link>

          {/* Pill-style nav tabs */}
          <nav className="flex items-center gap-1.5 rounded-[10px] bg-elevated/60 p-1.5 font-body text-sm">
            {ADMIN_NAV.map(({ href, label, exact, icon }) => {
              const active = isActive(href, exact);
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
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {email && <span className="font-code text-xs text-text-faint hidden sm:inline">{email}</span>}
          <button onClick={handleLogout} className="btn-secondary !px-3 !py-1.5 text-xs">
            লগআউট
          </button>
        </div>
      </div>
    </header>
  );
}