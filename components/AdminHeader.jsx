import Link from "next/link";
import { useRouter } from "next/router";
import { LanternMark } from "./SiteHeader";

export default function AdminHeader({ email }) {
  const router = useRouter();

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
            <span className="font-mono text-xs text-text-faint">/ প্যানেল</span>
          </Link>
          <nav className="flex items-center gap-1 font-body text-sm">
            <Link href="/admin" className="btn-ghost">অপেক্ষমাণ রিপোর্ট</Link>
            <Link href="/admin/published" className="btn-ghost">প্রকাশিত</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {email && <span className="font-mono text-xs text-text-faint">{email}</span>}
          <button onClick={handleLogout} className="btn-secondary !px-3 !py-1.5 text-xs">
            লগআউট
          </button>
        </div>
      </div>
    </header>
  );
}
