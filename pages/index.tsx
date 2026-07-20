import Head from "next/head";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { useI18n } from "../lib/i18n";

export default function Home() {
  const { t, lang } = useI18n();
  return (
    <>
      <Head>
        <title>
          {lang === "bn"
            ? "Nirbhoy — নাম প্রকাশ ছাড়াই আপনার এলাকার কথা বলুন"
            : "Nirbhoy — Speak up about your neighborhood, anonymously"}
        </title>
      </Head>

      <SiteHeader />

      <section className="relative overflow-hidden bg-gradient-to-b from-elevated/50 to-bg">
        {/* Subtle decorative gradient accents */}
        <div className="pointer-events-none absolute -top-40 right-0 h-[500px] w-[500px] opacity-[0.03] rounded-full bg-accent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-0 h-[400px] w-[400px] opacity-[0.02] rounded-full bg-accent blur-3xl" />

        <div className="relative mx-auto grid max-w-5xl gap-12 px-6 py-20 md:grid-cols-[1.2fr,1fr] md:py-28">
          <div className="animate-fade-in-up">
            <span className="case-stamp">
              <span className="term-ok">[ OK ]</span> NRB-2026-00147 · {lang === "bn" ? "উদাহরণ" : "example"}
            </span>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.15] text-text-primary md:text-5xl">
              {t("home.title.line1")}<span className="text-accent">_</span><br /> {t("home.title.line2")}
            </h1>
            <p className="mt-6 max-w-md font-code text-base leading-relaxed text-text-muted">
              <span className="text-accent">{'>'}</span> {t("home.subtitle")}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/submit" className="btn-primary">
                {t("home.cta.submit")}
              </Link>
              <Link href="/feed" className="btn-secondary">
                {t("home.cta.feed")}
              </Link>
            </div>
            <p className="mt-6 font-terminal text-xs text-text-faint">
              <span className="term-info">$</span> {t("home.tagline.note")}
            </p>
          </div>

          <div className="flex items-center justify-center animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <div className="card w-full max-w-sm">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="font-terminal text-xs text-accent">$ nirbhoy submit</span>
                <span className="font-terminal text-[10px] text-text-faint">PID: 0x7f4e</span>
              </div>
              <div className="mt-4 space-y-2 font-code text-xs text-text-muted">
                <p><span className="text-accent">{'>'}</span> title: <span className="text-text-primary">&ldquo;{lang === "bn" ? "গ্রামের রাস্তা সংস্কার" : "Village road repair"}&rdquo;</span></p>
                <p><span className="text-accent">{'>'}</span> type: <span className="text-text-primary">grievance</span></p>
                <p><span className="text-accent">{'>'}</span> location: <span className="text-text-primary">[REDACTED]</span></p>
                <p><span className="text-accent">{'>'}</span> identity: <span className="text-accent">anonymous</span></p>
                <div className="h-px bg-border my-2" />
                <p className="text-text-faint">encrypting payload...</p>
                <p className="text-accent">✓ report submitted successfully</p>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <span className="badge-reviewing">{t("home.demo.title")}</span>
                <span className="font-terminal text-xs text-accent">{t("home.demo.identity")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="font-display text-2xl font-semibold text-text-primary">
          <span className="text-accent">#</span> {t("home.trust.title")}
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <TrustCard
            title={t("home.trust.card1.title")}
            body={t("home.trust.card1.body")}
          />
          <TrustCard
            title={t("home.trust.card2.title")}
            body={t("home.trust.card2.body")}
          />
          <TrustCard
            title={t("home.trust.card3.title")}
            body={t("home.trust.card3.body")}
          />
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function TrustCard({ title, body }) {
  return (
    <div className="card">
      <h3 className="font-display text-lg font-medium text-text-primary">{title}</h3>
      <p className="mt-2 font-code text-sm leading-relaxed text-text-muted">{body}</p>
    </div>
  );
}
