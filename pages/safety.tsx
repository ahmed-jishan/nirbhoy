import Head from "next/head";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

/**
 * Whistleblower Safety Guide
 * --------------------------
 * A dedicated page teaching users how to report safely — what to include,
 * what to avoid, and how to keep themselves anonymous. This is one of the
 * most important pages on the site: an anonymous reporting platform is
 * only useful if reporters know how to *stay* anonymous.
 */
export default function SafetyGuide() {
  return (
    <>
      <Head>
        <title>নিরাপদে রিপোর্ট করার গাইড — Nirbhoy</title>
        <meta
          name="description"
          content="Nirbhoy-এ কিভাবে নিরাপদে ও পরিচয়গোপনে রিপোর্ট করবেন — একটি সম্পূর্ণ গাইড।"
        />
      </Head>
      <SiteHeader />

      <section className="mx-auto max-w-3xl px-6 py-14">
        <div className="flex items-center gap-3">
          <span className="font-terminal text-sm text-accent">$</span>
          <h1 className="font-display text-3xl font-semibold text-text-primary">
            নিরাপদে রিপোর্ট করার গাইড
          </h1>
        </div>
        <p className="mt-3 max-w-xl font-code text-sm leading-relaxed text-text-muted">
          <span className="text-accent">{">"}</span> আপনার পরিচয় গোপন রাখা আমাদের কাজ,
          কিন্তু কিছু সহজ সতর্কতা মানলে এটি আরও নিরাপদ হয়। এই গাইডটি একবার পড়ে নিন।
        </p>

        {/* Quick TL;DR box */}
        <div className="mt-8 rounded-md border border-accent/30 bg-accent-soft/40 p-5">
          <p className="font-terminal text-xs uppercase tracking-widest text-accent">
            $ tl;dr
          </p>
          <ul className="mt-3 space-y-2 font-code text-sm leading-relaxed text-text-primary">
            <li>
              <span className="text-accent">✓</span> নিজের নাম, ফোন নম্বর, বা ঠিকানা কখনোই লিখবেন না।
            </li>
            <li>
              <span className="text-accent">✓</span> ছবি/ভিডিও থেকে মেটাডেটা মুছে দিন।
            </li>
            <li>
              <span className="text-accent">✓</span> ব্যক্তিগত ওয়াইফাই বা পাবলিক ওয়াইফাই এড়িয়ে চলুন।
            </li>
            <li>
              <span className="text-accent">✓</span> প্রয়োজনে Tor Browser ব্যবহার করুন।
            </li>
            <li>
              <span className="text-accent">✓</span> কেস আইডি স্ক্রিনশট নিন — এটাই একমাত্র মাধ্যম।
            </li>
          </ul>
        </div>

        {/* Sections */}
        <div className="mt-10 space-y-10">
          <Section
            number="01"
            title="রিপোর্ট লেখার সময় কী উল্লেখ করবেন না"
            body={
              <>
                <p>
                  আপনি যা লিখেন তা মডারেটর পড়েন — কিন্তু আপনার লেখা থেকেই আপনাকে চেনা যেতে পারে।
                  নিচের তথ্যগুলো <span className="text-danger">কখনোই</span> রিপোর্টে দেবেন না:
                </p>
                <ul className="mt-3 space-y-1.5 list-inside">
                  <li>
                    <span className="text-danger">×</span> আপনার নাম বা পরিবারের সদস্যের নাম
                  </li>
                  <li>
                    <span className="text-danger">×</span> ফোন নম্বর, ইমেইল, বা সোশ্যাল মিডিয়া হ্যান্ডেল
                  </li>
                  <li>
                    <span className="text-danger">×</span> আপনার নির্দিষ্ট বাড়ির ঠিকানা
                  </li>
                  <li>
                    <span className="text-danger">×</span> এমন তথ্য যা শুধু আপনিই জানতে পারেন
                  </li>
                  <li>
                    <span className="text-danger">×</span> &ldquo;আমি সেখানে ছিলাম&rdquo; জাতীয় বাক্য যদি সন্দেহ তৈরি করতে পারে
                  </li>
                </ul>
                <p className="mt-3">
                  বরং ঘটনার বিবরণ থার্ড-পার্সনে লিখুন: &ldquo;এই এলাকায় একটি চুরির ঘটনা ঘটেছে&rdquo; —
                  &ldquo;আমি চুরি হতে দেখেছি&rdquo; না।
                </p>
              </>
            }
          />

          <Section
            number="02"
            title="ছবি ও ভিডিও থেকে মেটাডেটা মুছুন"
            body={
              <>
                <p>
                  প্রতিটি ছবিতে EXIF ডেটা থাকে — যেখানে GPS লোকেশন, ক্যামেরার সিরিয়াল নম্বর,
                  ও তোলার সময় সংরক্ষিত থাকে। এগুলো আপনাকে শনাক্ত করতে পারে।
                </p>
                <div className="mt-4 rounded-md border border-border bg-elevated/60 p-4">
                  <p className="font-terminal text-xs text-accent">$ EXIF মুছার উপায়:</p>
                  <ul className="mt-2 space-y-1.5 font-code text-sm">
                    <li>
                      <span className="text-accent">•</span> <strong>Windows:</strong> ছবিতে
                      right-click → Properties → Details → &ldquo;Remove Properties and Personal Information&rdquo;
                    </li>
                    <li>
                      <span className="text-accent">•</span> <strong>macOS:</strong> Preview-এ খুলুন →
                      Tools → Show Inspector → GPS ট্যাব → Remove Location Info
                    </li>
                    <li>
                      <span className="text-accent">•</span> <strong>Android/iOS:</strong> Scrambled EXIF
                      বা Metapho app ব্যবহার করুন
                    </li>
                    <li>
                      <span className="text-accent">•</span> <strong>স্ক্রিনশট বেশি নিরাপদ:</strong>
                      মূল ছবির স্ক্রিনশট নিলে মেটাডেটা মুছে যায়
                    </li>
                  </ul>
                </div>
              </>
            }
          />

          <Section
            number="03"
            title="নিরাপদ ইন্টারনেট সংযোগ"
            body={
              <>
                <p>
                  আপনার IP অ্যাড্রেস আমরা সংরক্ষণ না করলেও, ইন্টারনেট সার্ভিস প্রোভাইডার (ISP)
                  আপনার সংযোগ ট্র্যাক করে। নিচের সাবধানতা মানুন:
                </p>
                <ul className="mt-3 space-y-2 list-inside">
                  <li>
                    <span className="text-accent">→</span> <strong>নিজের বাড়ির ওয়াইফাই এড়িয়ে চলুন</strong> —
                    বরং ক্যাফে বা লাইব্রেরির পাবলিক ওয়াইফাই ব্যবহার করুন
                  </li>
                  <li>
                    <span className="text-accent">→</span> <strong>মোবাইল ডেটা ব্যবহার করলে</strong>,
                    সিমটি আপনার নামে নিবন্ধিত হলে সাবধান
                  </li>
                  <li>
                    <span className="text-accent">→</span> <strong>VPN ব্যবহার করুন</strong> — যেমন
                    ProtonVPN, Mullvad (no-log নীতি সহ)
                  </li>
                  <li>
                    <span className="text-accent">→</span> <strong>সবচেয়ে নিরাপদ:</strong>{" "}
                    <a
                      href="https://www.torproject.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline hover:no-underline"
                    >
                      Tor Browser
                    </a>{" "}
                    — এটি আপনার আসল IP পুরোপুরি লুকায়
                  </li>
                </ul>
              </>
            }
          />

          <Section
            number="04"
            title="ব্রাউজার ও ডিভাইস সুরক্ষা"
            body={
              <>
                <ul className="mt-1 space-y-2 list-inside">
                  <li>
                    <span className="text-accent">→</span> <strong>ইনকগনিটো/প্রাইভেট মোড</strong> চালু করুন —
                    ব্রাউজিং হিস্ট্রি বা কুকি সংরক্ষণ হয় না
                  </li>
                  <li>
                    <span className="text-accent">→</span> রিপোর্ট জমা দেওয়ার পর{" "}
                    <strong>ব্রাউজার ক্যাশ ও হিস্ট্রি মুছুন</strong>
                  </li>
                  <li>
                    <span className="text-accent">→</span> <strong>নিজের ব্যক্তিগত কম্পিউটার এড়িয়ে চলুন</strong>
                    বিশেষ করে সংবেদনশীল রিপোর্টের জন্য
                  </li>
                  <li>
                    <span className="text-accent">→</span> রিপোর্টের সাথে সম্পর্কিত কোনো ফাইল স্থানীয়ভাবে
                    সেভ রাখবেন না
                  </li>
                  <li>
                    <span className="text-accent">→</span> কেস আইডি সংরক্ষণ করলে সেটি{" "}
                    <strong>এনক্রিপ্টেড নোটে</strong> রাখুন (যেমন Standard Notes, KeePass)
                  </li>
                </ul>
              </>
            }
          />

          <Section
            number="05"
            title="আইনি সুরক্ষা"
            body={
              <>
                <p>
                  বাংলাদেশে &ldquo;হুইসেলব্লোয়ার প্রটেকশন আইন ২০১১&rdquo; (Public Interest Information Disclosure Act)
                  অনুযায়ী জনস্বার্থে তথ্য প্রকাশকারীদের জন্য কিছু সুরক্ষা রয়েছে।
                </p>
                <div className="mt-3 rounded-md border border-border bg-elevated/60 p-4 font-code text-sm">
                  <p className="text-accent">$ মূল বিষয়সমূহ:</p>
                  <ul className="mt-2 space-y-1.5">
                    <li>
                      <span className="text-accent">•</span> চাকরি হারানো বা প্রতিশোধ থেকে সুরক্ষা
                    </li>
                    <li>
                      <span className="text-accent">•</span> পরিচয় গোপন রাখার আইনি অধিকার
                    </li>
                    <li>
                      <span className="text-accent">•</span> ভয় দেখানো বা হয়রানি করা শাস্তিযোগ্য অপরাধ
                    </li>
                  </ul>
                </div>
                <p className="mt-3 text-xs text-text-faint">
                  <span className="term-warn">[!]</span> এই তথ্য শুধুমাত্র সাধারণ গাইডলাইন —
                  আইনি পরামর্শ নয়। সংবেদনশীল কেসে অ্যাডভোকেটের সাথে যোগাযোগ করুন।
                </p>
              </>
            }
          />

          <Section
            number="06"
            title="জরুরি হেল্পলাইন"
            body={
              <>
                <p className="mb-3">
                  যদি আপনি বা কেউ তাৎক্ষণিক বিপদে থাকেন — Nirbhoy অপেক্ষা করবেন না, সরাসরি
                  কর্তৃপক্ষকে জানান:
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <HelplineCard
                    label="জাতীয় জরুরি সেবা"
                    number="999"
                    note="পুলিশ / অ্যাম্বুলেন্স / ফায়ার সার্ভিস"
                  />
                  <HelplineCard
                    label="নারী ও শিশু নির্যাতন"
                    number="109"
                    note="মহিলা ও শিশু বিষয়ক মন্ত্রণালয়"
                  />
                  <HelplineCard
                    label="দুর্নীতি দমন কমিশন"
                    number="106"
                    note="দুর্নীতির অভিযোগ (টোল-ফ্রি)"
                  />
                  <HelplineCard
                    label="মানসিক স্বাস্থ্য"
                    number="09612-119911"
                    note="Kaan Pete Roi — শুনতে থাকা"
                  />
                </div>
              </>
            }
          />
        </div>

        {/* CTA */}
        <div className="mt-14 rounded-md border border-accent/30 bg-accent-soft/40 p-6 text-center">
          <p className="font-display text-lg font-semibold text-text-primary">
            প্রস্তুত? এখনই একটি রিপোর্ট জমা দিন।
          </p>
          <p className="mt-2 font-code text-sm text-text-muted">
            <span className="term-info">$</span> কোনো একাউন্ট লাগবে না। কেউ আপনার পরিচয় জানবে না।
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/submit" className="btn-primary">
              একটি রিপোর্ট জমা দিন
            </Link>
            <Link href="/how-it-works" className="btn-secondary">
              [ কীভাবে কাজ করে ]
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function Section({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="font-terminal text-xs text-accent">[{number}]</span>
        <h2 className="font-display text-xl font-semibold text-text-primary">{title}</h2>
      </div>
      <div className="mt-3 font-code text-sm leading-relaxed text-text-muted">{body}</div>
    </div>
  );
}

function HelplineCard({
  label,
  number,
  note,
}: {
  label: string;
  number: string;
  note: string;
}) {
  return (
    <div className="rounded-md border border-border bg-elevated/60 p-4">
      <p className="font-terminal text-[10px] uppercase tracking-widest text-text-faint">
        {label}
      </p>
      <a
        href={`tel:${number.replace(/[^\d]/g, "")}`}
        className="mt-1 block font-display text-xl font-semibold text-accent hover:underline"
      >
        {number}
      </a>
      <p className="mt-1 font-code text-xs text-text-muted">{note}</p>
    </div>
  );
}
