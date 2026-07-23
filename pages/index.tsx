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

      {/* ═══════════════════════════════════════════════════════════════════
         HERO — Single, continuous page with no section dividers
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-elevated/40 via-bg to-elevated/20">
        {/* Decorative background blurs */}
        <div className="pointer-events-none absolute -top-48 right-0 h-[700px] w-[700px] opacity-[0.03] rounded-full bg-accent blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] opacity-[0.015] rounded-full bg-accent blur-[100px]" />

        <div className="relative mx-auto max-w-5xl px-6 pt-24 pb-20 md:pt-32 md:pb-28">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-soft/30 px-4 py-1.5 mb-8">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span className="font-terminal text-[11px] tracking-widest text-accent uppercase">
                {lang === "bn" ? "বেনামী রিপোর্টিং" : "Anonymous Reporting"}
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl font-bold leading-[1.2] text-text-primary md:text-5xl lg:text-6xl">
              <span className="text-accent">{'>>'}</span>{' '}
              {lang === "bn" ? "আপনার একটি কণ্ঠস্বর," : "Your voice,"}
              <br />
              <span className="bg-gradient-to-r from-accent via-accent-bright to-accent bg-clip-text text-transparent">
                {lang === "bn" ? "একটি সমাজ বদলাতে যথেষ্ট।" : "is enough to change society."}
              </span>
            </h1>

            <div className="mt-8 space-y-4 font-code text-base leading-relaxed text-text-muted md:text-lg">
              <p>
                {lang === "bn"
                  ? "যা দেখেছেন, তা চাপা পড়ে থাকতে দেবেন না। আপনার এলাকার অনিয়ম, দুর্নীতি বা অন্যায়ের বিরুদ্ধে কথা বলুন — নাম প্রকাশ ছাড়াই, নিরাপদে। প্রতিটি রিপোর্ট দেশ গড়ার একটি পদক্ষেপ।"
                  : "Don't let what you've seen stay buried. Speak up against irregularities, corruption, and injustice in your area — anonymously, safely. Every report is a step toward building a nation."}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/submit"
                className="group relative inline-flex items-center gap-2.5 rounded-xl bg-accent px-8 py-4 font-display text-base font-semibold text-bg transition-all duration-300 hover:bg-accent-dim hover:shadow-[0_0_30px_rgba(13,148,136,0.25)] active:scale-[0.98]"
              >
                <span className="relative z-10">
                  {lang === "bn" ? "আজই রিপোর্ট করুন" : "Report Now"}
                </span>
                <svg className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 3L11 8L5 13" />
                </svg>
              </Link>
              <Link
                href="/feed"
                className="inline-flex items-center gap-2.5 rounded-xl border border-borderStrong bg-elevated/80 px-8 py-4 font-display text-base font-semibold text-text-primary transition-all duration-300 hover:border-accent/30 hover:bg-accent-soft/20 hover:text-accent"
              >
                {lang === "bn" ? "রিপোর্ট দেখুন" : "View Reports"}
              </Link>
            </div>

            <p className="mt-6 font-terminal text-xs text-text-faint">
              <span className="text-accent">$</span>{' '}
              {lang === "bn"
                ? "আপনার পরিচয় সম্পূর্ণ সুরক্ষিত — কোনো নাম, ইমেইল, বা ফোন নম্বর লাগবে না"
                : "Your identity is fully protected — no name, email, or phone number needed"}
            </p>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
             Seamless Quote — flows directly after hero, no divider
             ═══════════════════════════════════════════════════════════════ */}
          <div className="mx-auto max-w-3xl mt-28 md:mt-36">
            <div className="text-center">
              <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft/40 border border-accent/20">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-accent">
                  <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
                  <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
                </svg>
              </div>

              <blockquote className="font-display text-2xl font-medium leading-relaxed text-text-primary md:text-3xl">
                {lang === "bn"
                  ? '"চুপ থাকলে অনিয়ম টিকে থাকে, কথা বললে পরিবর্তন শুরু হয়। আপনি হয়তো একা একটি রিপোর্ট দিচ্ছেন — কিন্তু হাজারো মানুষের এমন সাহসেই একদিন একটি স্বচ্ছ, দায়বদ্ধ সমাজ গড়ে ওঠে। আপনার নিরাপত্তা আমাদের দায়িত্ব, পরিবর্তন আনা আপনার শক্তি।"'
                  : '"Injustice thrives when we stay silent, but change begins when we speak. You may be submitting just one report — but it takes the courage of thousands like you to build a transparent, accountable society. Your safety is our responsibility; driving change is your power."'}
              </blockquote>
            </div>

            {/* Feature badges — inline, no grid break */}
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              {[
                {
                  stat: "100%",
                  label: lang === "bn" ? "বেনামী" : "Anonymous",
                  desc: lang === "bn" ? "কোনো পরিচয় নেই" : "No identity tracked",
                },
                {
                  stat: "🔒",
                  label: lang === "bn" ? "এনক্রিপ্টেড" : "Encrypted",
                  desc: lang === "bn" ? "নিরাপদ জমা" : "Secure submission",
                },
                {
                  stat: "⚡",
                  label: lang === "bn" ? "তৎক্ষণিক" : "Instant",
                  desc: lang === "bn" ? "মুহূর্তেই রিপোর্ট" : "Report in seconds",
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-xl border border-border bg-elevated/60 px-5 py-4">
                  <span className="font-display text-2xl font-bold text-accent">{item.stat}</span>
                  <div className="text-left">
                    <p className="font-code text-sm font-medium text-text-primary">{item.label}</p>
                    <p className="font-terminal text-xs text-text-muted">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
             Call to Action — seamless continuation, no divider
             ═══════════════════════════════════════════════════════════════ */}
          <div className="mx-auto max-w-3xl mt-28 md:mt-36 text-center">
            <h2 className="font-display text-3xl font-bold text-text-primary md:text-4xl">
              {lang === "bn"
                ? "আজই প্রথম পদক্ষেপ নিন"
                : "Take the First Step Today"}
            </h2>

            <p className="mx-auto mt-6 max-w-2xl font-code text-lg leading-relaxed text-text-muted">
              {lang === "bn"
                ? "আপনার একটি রিপোর্ট হতে পারে কারও ন্যায়বিচার পাওয়ার শুরু।"
                : "Your single report could be the beginning of someone's journey to justice."}
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/submit"
                className="inline-flex items-center gap-2.5 rounded-xl bg-accent px-10 py-5 font-display text-lg font-semibold text-bg transition-all duration-300 hover:bg-accent-dim hover:shadow-[0_0_30px_rgba(13,148,136,0.25)] active:scale-[0.98]"
              >
                {lang === "bn" ? "রিপোর্ট করুন" : "Submit a Report"}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 rounded-xl border border-borderStrong bg-elevated/60 px-8 py-5 font-display text-base font-semibold text-text-primary transition-all duration-300 hover:border-accent/30 hover:text-accent"
              >
                {lang === "bn" ? "কীভাবে কাজ করে" : "How It Works"}
              </Link>
            </div>

            <div className="mt-12 inline-flex items-center gap-3 rounded-full border border-accent/20 bg-accent-soft/20 px-5 py-2">
              <span className="inline-block h-2 w-2 rounded-full bg-accent" />
              <span className="font-terminal text-xs tracking-wider text-accent">
                {lang === "bn"
                  ? "বেনামী · নিরাপদ · এনড-টু-এন্ড এনক্রিপ্টেড"
                  : "Anonymous · Safe · End-to-End Encrypted"}
              </span>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
             Trust Cards — seamless, organized
             ═══════════════════════════════════════════════════════════════ */}
          <div className="mx-auto max-w-5xl mt-28 md:mt-36">
            <div className="text-center mb-12">
              <h2 className="font-display text-2xl font-semibold text-text-primary">
                <span className="text-accent">#</span> {t("home.trust.title")}
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <TrustCard
                icon="🛡️"
                title={t("home.trust.card1.title")}
                body={t("home.trust.card1.body")}
              />
              <TrustCard
                icon="🔒"
                title={t("home.trust.card2.title")}
                body={t("home.trust.card2.body")}
              />
              <TrustCard
                icon="⚖️"
                title={t("home.trust.card3.title")}
                body={t("home.trust.card3.body")}
              />
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function TrustCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="group card text-center !p-8 hover:border-accent/20 transition-all duration-300 hover:shadow-[0_0_20px_rgba(13,148,136,0.06)]">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft/30 border border-accent/10 text-2xl transition-transform group-hover:scale-110">
        {icon}
      </div>
      <h3 className="font-display text-lg font-medium text-text-primary">{title}</h3>
      <p className="mt-3 font-code text-sm leading-relaxed text-text-muted">{body}</p>
    </div>
  );
}