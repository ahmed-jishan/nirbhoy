import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

const FAQS = [
  {
    q: "আমার পরিচয় কি সত্যিই গোপন থাকবে?",
    a: "হ্যাঁ। আমরা আপনার নাম, ফোন নম্বর, ইমেইল, আইপি অ্যাড্রেস বা সঠিক লোকেশন সংরক্ষণ করি না। জমা দেওয়ার পর আপনি শুধু একটি কেস নম্বর পান — যা দিয়ে পরে স্ট্যাটাস দেখতে পারেন। আমাদের কাছে আপনার পরিচয় শনাক্ত করার কোনো উপায় নেই।",
  },
  {
    q: "আমার রিপোর্ট কি সরাসরি প্রকাশিত হয়?",
    a: "না। কোনো রিপোর্ট সরাসরি পাবলিক ফিডে যায় না। প্রথমে একজন নিরপেক্ষ মডারেটর প্রমাণ ও বিবরণ যাচাই করেন। যাচাইয়ের পর শুধু একটি নাম-বিহীন সারাংশ প্রকাশিত হয় — যাতে কাউকে শনাক্ত করা না যায়।",
  },
  {
    q: "আমি কীভাবে আমার রিপোর্টের অবস্থা দেখব?",
    a: "রিপোর্ট জমা দেওয়ার পর আপনি একটি কেস নম্বর (যেমন: NRB-2026-00147) পাবেন। এই নম্বরটি 'স্ট্যাটাস দেখুন' পেজে দিয়ে আপনার রিপোর্টের বর্তমান অবস্থা যাচাই করতে পারেন।",
  },
  {
    q: "কোন ধরনের রিপোর্ট জমা দেওয়া যাবে?",
    a: "আপনি অপরাধ/ঘটনা (যেমন চুরি, সহিংসতা) অথবা সাধারণ অভিযোগ (যেমন সেবা, দুর্নীতি, অব্যবস্থাপনা) জমা দিতে পারেন। তবে মিথ্যা বা ভিত্তিহীন অভিযোগ দেওয়া থেকে বিরত থাকুন — যাচাইয়ের সময় তা ধরা পড়বে।",
  },
  {
    q: "প্রমাণ হিসেবে কী কী জমা দেওয়া যাবে?",
    a: "আপনি ছবি (JPG, PNG, WebP, GIF) এবং ভিডিও (MP4, WebM, MOV) জমা দিতে পারেন। সর্বোচ্চ ১০টি ফাইল আপলোড করা যাবে, মোট আকার ৩০MB-এর কম হতে হবে। প্রতিটি ফাইল সর্বোচ্চ ১৫MB হতে পারে।",
  },
  {
    q: "আমার প্রমাণ কি নিরাপদ?",
    a: "হ্যাঁ। আপনার জমা দেওয়া ছবি ও ভিডিও এনক্রিপ্টেড ও প্রাইভেট থাকে — শুধুমাত্র অনুমোদিত মডারেটর যাচাইয়ের জন্য দেখতে পারেন। পাবলিক ফিডে কখনোই প্রমাণ প্রকাশ করা হয় না।",
  },
  {
    q: "আমি কি মোবাইল থেকে রিপোর্ট জমা দিতে পারি?",
    a: "অবশ্যই। Nirbhoy সম্পূর্ণ মোবাইল-ফ্রেন্ডলি। আপনি যেকোনো ব্রাউজার থেকে সরাসরি রিপোর্ট জমা দিতে পারেন — কোনো অ্যাপ ডাউনলোডের প্রয়োজন নেই।",
  },
  {
    q: "কেউ কি জানতে পারবে যে আমি রিপোর্ট করেছি?",
    a: "না। আমরা কোনো লগইন সিস্টেম রাখি না, আইপি সংরক্ষণ করি না, এবং আপনার ব্রাউজারে কোনো ট্র্যাকিং কুকি সেট করি না। আপনি সম্পূর্ণ অজ্ঞাত থাকেন।",
  },
  {
    q: "ভুলবশত মিথ্যা রিপোর্ট দিলে কী হবে?",
    a: "প্রতিটি রিপোর্ট মডারেটর দ্বারা যাচাই করা হয়। মিথ্যা বা ভিত্তিহীন রিপোর্ট প্রত্যাখ্যান করা হবে। ইচ্ছাকৃতভাবে মিথ্যা রিপোর্ট দেওয়া প্ল্যাটফর্মের নীতির লঙ্ঘন।",
  },
  {
    q: "আমার রিপোর্ট কি কর্তৃপক্ষের কাছে পাঠানো হয়?",
    a: "গুরুতর ঘটনার (যেমন চুরি, সহিংসতা) ক্ষেত্রে বিস্তারিত তথ্য সরাসরি স্থানীয় প্রশাসন বা পুলিশকে পাঠানো হতে পারে — তবে তা জনসাধারণের ফিডে প্রকাশ করা হয় না। সাধারণ অভিযোগের ক্ষেত্রে শুধু সারাংশ প্রকাশিত হয়।",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <Head>
        <title>সচরাচর জিজ্ঞাসা — Nirbhoy</title>
        <meta name="description" content="Nirbhoy প্ল্যাটফর্ম সম্পর্কে সাধারণ প্রশ্ন ও উত্তর — আপনার পরিচয় গোপন রেখে কীভাবে রিপোর্ট করবেন, কীভাবে যাচাই করা হয়, এবং আপনার তথ্য কতটা নিরাপদ।" />
      </Head>
      <SiteHeader />

      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-center gap-3">
          <span className="font-terminal text-sm text-accent">$</span>
          <h1 className="font-display text-3xl font-semibold text-text-primary">সচরাচর জিজ্ঞাসা</h1>
        </div>
        <p className="mt-3 font-code text-sm leading-relaxed text-text-muted">
          Nirbhoy প্ল্যাটফর্ম সম্পর্কে সাধারণ প্রশ্ন ও উত্তর। আরও কিছু জানতে চাইলে আমাদের{' '}
          <Link href="/how-it-works" className="text-accent underline underline-offset-2 hover:text-accent-bright">
            কীভাবে কাজ করে
          </Link>{' '}
          পেজটি দেখুন।
        </p>

        <div className="mt-10 space-y-3">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-md border border-border bg-elevated/60 overflow-hidden transition-all duration-200"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-elevated/80"
              >
                <span className="font-code text-sm font-medium text-text-primary flex-1">
                  <span className="text-accent">{'>'}</span> {faq.q}
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className={`shrink-0 transition-transform duration-200 ${openIndex === idx ? "rotate-180" : ""}`}
                >
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted" />
                </svg>
              </button>
              {openIndex === idx && (
                <div className="px-5 pb-4">
                  <div className="h-px bg-border mb-3" />
                  <p className="font-code text-sm leading-relaxed text-text-muted">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 card text-center">
          <p className="font-code text-sm text-text-muted">
            <span className="term-info">$</span> আরও কিছু জানতে চান?{' '}
            <Link href="/how-it-works" className="text-accent underline underline-offset-2 hover:text-accent-bright">
              কীভাবে কাজ করে
            </Link>{' '}
            দেখুন বা একটি{' '}
            <Link href="/submit" className="text-accent underline underline-offset-2 hover:text-accent-bright">
              রিপোর্ট জমা দিন
            </Link>
            ।
          </p>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}