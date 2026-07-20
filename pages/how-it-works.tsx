import Head from "next/head";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

const STEPS = [
  {
    n: "১",
    title: "আপনি রিপোর্ট জমা দেন",
    body: "নাম বা পরিচয় ছাড়াই ঘটনার বিবরণ, স্থান, এবং চাইলে প্রমাণ (ছবি/ভিডিও) জমা দিন। জমা দেওয়ার সাথে সাথেই একটি কেস নম্বর পাবেন।",
  },
  {
    n: "২",
    title: "একজন যাচাইকারী পর্যালোচনা করেন",
    body: "কোনো রিপোর্ট সরাসরি প্রকাশ হয় না। একজন নিরপেক্ষ মডারেটর প্রমাণ ও বিবরণ যাচাই করে দেখেন এটি বাস্তবসম্মত কি না।",
  },
  {
    n: "৩",
    title: "প্রয়োজনে সংশ্লিষ্ট কর্তৃপক্ষকে জানানো হয়",
    body: "গুরুতর ঘটনার (যেমন চুরি) ক্ষেত্রে বিস্তারিত তথ্য সরাসরি স্থানীয় প্রশাসন বা পুলিশকে পাঠানো হয় — জনসাধারণের ফিডে নয়।",
  },
  {
    n: "৪",
    title: "একটি নিরাপদ সারাংশ প্রকাশ হয়",
    body: "জনসাধারণের ফিডে শুধু একটি নাম-বিহীন সারাংশ প্রকাশ হয় — কখনোই কোনো ব্যক্তির নাম বা তাকে শনাক্ত করা যায় এমন তথ্য নয়।",
  },
];

export default function HowItWorks() {
  return (
    <>
      <Head>
        <title>কীভাবে কাজ করে — Nirbhoy</title>
      </Head>
      <SiteHeader />

      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-3xl font-semibold text-text-primary">কীভাবে কাজ করে</h1>
        <p className="mt-4 max-w-xl font-body text-sm leading-relaxed text-text-muted">
          Nirbhoy একটি সতর্কতার সাথে মডারেট করা প্ল্যাটফর্ম — এটি কোনো অভিযোগ যাচাই ছাড়া প্রকাশ করে
          না, এবং কখনোই কোনো ব্যক্তির নাম প্রকাশ্যে প্রকাশ করে না। এর লক্ষ্য গুজব বা ভুল বিচার
          ছড়ানো নয় — বরং নিরাপদে সমস্যা তুলে ধরে সঠিক জায়গায় পৌঁছে দেওয়া।
        </p>

        <ol className="mt-12 space-y-8">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-5">
              <span className="font-mono text-sm text-accent">{s.n}</span>
              <div>
                <h3 className="font-display text-lg font-medium text-text-primary">{s.title}</h3>
                <p className="mt-1.5 font-body text-sm leading-relaxed text-text-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="card mt-14">
          <h3 className="font-display text-lg font-medium text-text-primary">যা এখানে হয় না</h3>
          <ul className="mt-3 space-y-2 font-body text-sm text-text-muted">
            <li>— কোনো ব্যক্তির নাম কখনোই পাবলিক ফিডে দেখানো হয় না।</li>
            <li>— অযাচাইকৃত অভিযোগ সরাসরি প্রকাশ হয় না।</li>
            <li>— আপনার IP, ফোন নম্বর, বা সঠিক লোকেশন সংরক্ষণ করা হয় না।</li>
          </ul>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
