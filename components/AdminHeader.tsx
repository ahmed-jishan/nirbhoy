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
      <div className="mx-auto flex max-w-6xl items-center justify-between px-2 sm:px-6 py-1.5 sm:py-3 gap-1 sm:gap-2">
        <div className="flex items-center gap-0.5 sm:gap-4 min-w-0 flex-1">
          {/* Logo - icon only on mobile, full on sm+ */}
          <Link href="/admin" className="flex items-center gap-1 shrink-0">
            <LanternMark size={16} />
            <span className="font-display text-xs sm:text-base font-semibold text-text-primary truncate hidden sm:inline">Nirbhoy</span>
            <span className="font-terminal text-[10px] text-accent hidden md:inline">/ প্যানেল</span>
          </Link>

          {/* Pill-style nav tabs - icons only on mobile, full on sm+ */}
          <div className="overflow-x-auto flex-shrink min-w-0 scrollbar-none">
            <nav className="flex items-center gap-0.5 sm:gap-1 rounded-[8px] sm:rounded-[10px] bg-elevated/60 p-0.5 sm:p-1 font-body whitespace-nowrap">
              {ADMIN_NAV.map(({ href, label, exact, icon }) => {
                const active = isActive(href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`inline-flex items-center justify-center sm:justify-start gap-0.5 sm:gap-1.5 rounded-md sm:rounded-lg px-1.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-sm font-medium transition-all duration-200 ${
                      active
                        ? "bg-bg text-text-primary border border-borderStrong shadow-sm"
                        : "text-text-muted hover:text-text-primary hover:bg-elevated2/50 border border-transparent"
                    }`}
                    title={label}
                  >
                    <span className="text-xs sm:text-[13px]" aria-hidden="true">{icon}</span>
                    <span className="hidden sm:inline">{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-4 shrink-0">
          {email && <span className="font-code text-[10px] text-text-faint hidden lg:inline truncate max-w-[100px] xl:max-w-none">{email}</span>}
          <button onClick={handleLogout} className="btn-secondary !px-2 !py-1 sm:!px-3 sm:!py-1.5 text-[10px] sm:text-xs whitespace-nowrap">
            লগআউট
          </button>
        </div>
      </div>
    </header>
  );
}