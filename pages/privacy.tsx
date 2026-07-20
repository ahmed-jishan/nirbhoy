import Head from "next/head";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

export default function Privacy() {
  return (
    <>
      <Head>
        <title>গোপনীয়তা নীতি — Nirbhoy</title>
        <meta name="description" content="Nirbhoy প্ল্যাটফর্মের গোপনীয়তা নীতি — আমরা কীভাবে আপনার তথ্য সুরক্ষিত রাখি, কী সংগ্রহ করি না, এবং আপনার গোপনীয়তা কীভাবে নিশ্চিত করি।" />
      </Head>
      <SiteHeader />

      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-center gap-3">
          <span className="font-terminal text-sm text-accent">$</span>
          <h1 className="font-display text-3xl font-semibold text-text-primary">গোপনীয়তা নীতি</h1>
        </div>
        <p className="mt-3 font-terminal text-xs text-text-muted">সর্বশেষ আপডেট: জুলাই ২০২৬</p>

        <div className="mt-10 space-y-8 font-code text-sm leading-relaxed text-text-muted">
          <Section title="আমরা কী তথ্য সংগ্রহ করি না">
            <p>Nirbhoy-এ রিপোর্ট জমা দেওয়ার সময় আমরা ইচ্ছাকৃতভাবে নিম্নলিখিত তথ্য সংগ্রহ করি না:</p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li>আপনার নাম বা ব্যবহারকারীর নাম</li>
              <li>ইমেইল ঠিকানা বা ফোন নম্বর</li>
              <li>আইপি অ্যাড্রেস (আমরা আইপি লগ সংরক্ষণ করি না)</li>
              <li>আপনার সঠিক অবস্থান (আপনি ম্যাপে যে পিন দেন তা শুধু ঘটনার অবস্থান, আপনার অবস্থান নয়)</li>
              <li>ব্রাউজার ফিঙ্গারপ্রিন্ট বা ট্র্যাকিং কুকি</li>
              <li>সোশ্যাল মিডিয়া বা থার্ড-পার্টি লগইন তথ্য (আমাদের কোনো লগইন সিস্টেম নেই)</li>
            </ul>
          </Section>

          <Section title="আমরা কী তথ্য সংগ্রহ করি">
            <p>আমরা শুধু নিম্নলিখিত তথ্য সংগ্রহ করি যা আপনার পরিচয় শনাক্ত করতে পারে না:</p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li>আপনার রিপোর্টের বিবরণ (শিরোনাম, বর্ণনা, ধরন)</li>
              <li>ঘটনার অবস্থান (বিভাগ, জেলা, থানা — এবং ঐচ্ছিকভাবে ম্যাপ পিন)</li>
              <li>আপনার জমা দেওয়া প্রমাণ (ছবি/ভিডিও) — যা প্রাইভেট থাকে</li>
              <li>একটি স্বয়ংক্রিয়-উৎপন্ন কেস নম্বর</li>
            </ul>
          </Section>

          <Section title="আপনার ডেটা কীভাবে সংরক্ষিত হয়">
            <p>
              আপনার রিপোর্ট ও প্রমাণ এনক্রিপ্টেড অবস্থায় Firebase-এ সংরক্ষিত হয়। শুধুমাত্র অনুমোদিত মডারেটর
              যাচাইয়ের জন্য এগুলো দেখতে পারেন। পাবলিক ফিডে শুধু একটি নাম-বিহীন সারাংশ প্রকাশিত হয় — কখনোই
              সম্পূর্ণ বিবরণ বা প্রমাণ নয়।
            </p>
          </Section>

          <Section title="কুকি ও ট্র্যাকিং">
            <p>
              Nirbhoy কোনো ট্র্যাকিং কুকি, থার্ড-পার্টি অ্যানালিটিক্স, বা বিজ্ঞাপন ব্যবহার করে না।
              আমরা শুধু Cloudflare Turnstile CAPTCHA ব্যবহার করি যা স্প্যাম প্রতিরোধে সহায়ক — এটি আপনার
              গোপনীয়তা বজায় রাখে।
            </p>
          </Section>

          <Section title="থার্ড-পার্টি সার্ভিস">
            <p>আমরা নিম্নলিখিত থার্ড-পার্টি সার্ভিস ব্যবহার করি — প্রতিটি তাদের নিজস্ব গোপনীয়তা নীতি অনুসরণ করে:</p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li><strong>Firebase (Google):</strong> ডেটা সংরক্ষণ ও পরিচালনার জন্য</li>
              <li><strong>Cloudinary:</strong> ছবি ও ভিডিও আপলোড ও সংরক্ষণের জন্য</li>
              <li><strong>Cloudflare:</strong> CAPTCHA ও CDN সেবার জন্য</li>
              <li><strong>OpenFreeMap / Leaflet:</strong> মানচিত্র প্রদর্শনের জন্য (কোনো ডেটা পাঠানো হয় না)</li>
            </ul>
          </Section>

          <Section title="ডেটা মুছে ফেলা">
            <p>
              আপনার রিপোর্ট যাচাই বা প্রত্যাখ্যানের পর এটি স্বয়ংক্রিয়ভাবে নির্দিষ্ট সময় পর মুছে ফেলা হয়।
              আপনি যদি মনে করেন আপনার তথ্য অপসারণ করা প্রয়োজন, তবে আমাদের সাথে যোগাযোগ করুন।
              মনে রাখবেন: যেহেতু আমরা কোনো পরিচয় সংরক্ষণ করি না, আমরা কোনো নির্দিষ্ট ইউজারের ডেটা শনাক্ত করতে পারি না।
            </p>
          </Section>

          <Section title="যোগাযোগ">
            <p>
              গোপনীয়তা সম্পর্কিত কোনো প্রশ্ন থাকলে ইমেইল করুন:{' '}
              <span className="text-accent">privacy@nirbhoy.app</span>
            </p>
          </Section>
        </div>

        <div className="mt-12 card text-center">
          <p className="font-code text-sm text-text-muted">
            <span className="term-info">$</span> আমাদের{' '}
            <Link href="/terms" className="text-accent underline underline-offset-2 hover:text-accent-bright">
              পরিষেবার শর্তাবলী
            </Link>{' '}
            এবং{' '}
            <Link href="/faq" className="text-accent underline underline-offset-2 hover:text-accent-bright">
              সচরাচর জিজ্ঞাসা
            </Link>{' '}
            দেখুন।
          </p>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="font-display text-lg font-medium text-text-primary mb-3">
        <span className="text-accent">#</span> {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}