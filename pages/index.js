import Head from "next/head";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

export default function Home() {
  return (
    <>
      <Head>
        <title>Nirbhoy — নাম প্রকাশ ছাড়াই আপনার এলাকার কথা বলুন</title>
      </Head>

      <SiteHeader />

      <section className="relative overflow-hidden bg-lantern">
        <div className="mx-auto grid max-w-5xl gap-12 px-6 py-20 md:grid-cols-[1.2fr,1fr] md:py-28">
          <div>
            <span className="case-stamp">NRB-2026-00147 · উদাহরণ</span>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.15] text-text-primary md:text-5xl">
              যা দেখেছেন, বলুন —<br /> নাম প্রকাশ ছাড়াই।
            </h1>
            <p className="mt-6 max-w-md font-body text-base leading-relaxed text-text-muted">
              গ্রামে বা এলাকায় কিছু ভুল ঘটতে দেখলে, প্রমাণ থাকলেও প্রায়ই সরাসরি বলার সাহস হয় না।
              Nirbhoy-এ আপনি সম্পূর্ণ পরিচয়গোপনে রিপোর্ট জমা দিতে পারবেন — কোনো নাম, ফোন নম্বর
              বা লোকেশন সংরক্ষণ করা হয় না।
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/submit" className="btn-primary">
                একটি রিপোর্ট জমা দিন
              </Link>
              <Link href="/feed" className="btn-secondary">
                জনসাধারণের ফিড দেখুন
              </Link>
            </div>
            <p className="mt-6 font-mono text-xs text-text-faint">
              প্রতিটি রিপোর্ট একটি কেস নম্বর পায় — যাতে নাম ছাড়াই আপনি পরে অবস্থা যাচাই করতে পারেন।
            </p>
          </div>

          <div className="flex items-center justify-center">
            <div className="card w-full max-w-sm">
              <p className="font-mono text-[11px] uppercase tracking-wider text-text-faint">অ্যানোনিমাস রিপোর্ট</p>
              <div className="mt-4 space-y-3">
                <div className="h-2.5 w-3/4 rounded bg-elevated2" />
                <div className="h-2.5 w-full rounded bg-elevated2" />
                <div className="h-2.5 w-5/6 rounded bg-elevated2" />
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <span className="badge-reviewing">যাচাই চলছে</span>
                <span className="font-mono text-xs text-text-faint">পরিচয় গোপন</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="font-display text-2xl font-semibold text-text-primary">এটি কীভাবে নিরাপদ রাখে</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <TrustCard
            title="সরাসরি প্রকাশ হয় না"
            body="আপনার রিপোর্ট আগে একজন যাচাইকারী দেখেন। কোনো ব্যক্তির নাম কখনোই পাবলিক ফিডে প্রকাশ করা হয় না — শুধু ঘটনার সারাংশ।"
          />
          <TrustCard
            title="কোনো পরিচয় সংরক্ষণ হয় না"
            body="আমরা আপনার নাম, ফোন নম্বর, বা নির্ভুল লোকেশন সংগ্রহ করি না। শুধু একটি কেস নম্বর দেওয়া হয়।"
          />
          <TrustCard
            title="প্রমাণ সুরক্ষিত থাকে"
            body="ছবি বা ভিডিও প্রমাণ এনক্রিপ্টেড ও প্রাইভেট থাকে — শুধু অনুমোদিত মডারেটর যাচাইয়ের জন্য দেখতে পারেন।"
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
      <p className="mt-2 font-body text-sm leading-relaxed text-text-muted">{body}</p>
    </div>
  );
}
