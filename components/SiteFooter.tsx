import Link from "next/link";
import { useI18n } from "../lib/i18n";

export default function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto max-w-5xl px-6 py-10 font-code text-sm text-text-muted">
        <p className="max-w-xl leading-relaxed">
          <span className="term-ok">[ OK ]</span> {t("footer.blurb")}
        </p>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs">
          <Link href="/how-it-works" className="hover:text-accent transition-colors">{'>'} {t("footer.how")}</Link>
          <Link href="/safety" className="hover:text-accent transition-colors">{'>'} {t("footer.safety")}</Link>
          <Link href="/feed" className="hover:text-accent transition-colors">{'>'} {t("footer.feed")}</Link>
          <Link href="/stats" className="hover:text-accent transition-colors">{'>'} {t("footer.stats")}</Link>
          <Link href="/faq" className="hover:text-accent transition-colors">{'>'} {t("footer.faq")}</Link>
          <Link href="/privacy" className="hover:text-accent transition-colors">{'>'} {t("footer.privacy")}</Link>
          <Link href="/terms" className="hover:text-accent transition-colors">{'>'} {t("footer.terms")}</Link>
        </div>
        <p className="mt-8 font-terminal text-xs text-text-faint">[ EOF ] © {new Date().getFullYear()} Nirbhoy</p>
      </div>
    </footer>
  );
}
