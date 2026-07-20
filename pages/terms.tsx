import Head from "next/head";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

export default function Terms() {
  return (
    <>
      <Head>
        <title>পরিষেবার শর্তাবলী — Nirbhoy</title>
        <meta name="description" content="Nirbhoy প্ল্যাটফর্মের পরিষেবার শর্তাবলী — ব্যবহারের নিয়ম, দায়িত্ব ও সীমাবদ্ধতা।" />
      </Head>
      <SiteHeader />

      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-center gap-3">
          <span className="font-terminal text-sm text-accent">$</span>
          <h1 className="font-display text-3xl font-semibold text-text-primary">পরিষেবার শর্তাবলী</h1>
        </div>
        <p className="mt-3 font-terminal text-xs text-text-muted">সর্বশেষ আপডেট: জুলাই ২০২৬</p>

        <div className="mt-10 space-y-8 font-code text-sm leading-relaxed text-text-muted">
          <Section title="গ্রহণযোগ্যতা">
            <p>
              Nirbhoy ব্যবহার করার মাধ্যমে আপনি এই শর্তাবলী মেনে চলতে বাধ্য। আপনি যদি কোনো শর্তে
              একমত না হন, তাহলে প্ল্যাটফর্ম ব্যবহার করবেন না।
            </p>
          </Section>

          <Section title="প্ল্যাটফর্মের বিবরণ">
            <p>
              Nirbhoy একটি নাম প্রকাশ না করে অভিযোগ জমা দেওয়ার প্ল্যাটফর্ম। এটি কোনো সরকারি সংস্থা,
              পুলিশ বিভাগ, বা আইনি প্রতিষ্ঠানের অংশ নয়। আমরা রিপোর্ট যাচাই করি এবং প্রয়োজন হলে
              কর্তৃপক্ষের কাছে তথ্য পাঠাই, কিন্তু আমরা কোনো ঘটনার সত্যতা নিশ্চিত করতে পারি না।
            </p>
          </Section>

          <Section title="ব্যবহারের নিয়ম">
            <p>Nirbhoy ব্যবহার করার সময় আপনি নিম্নলিখিত বিষয়গুলি মেনে চলতে বাধ্য:</p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li>আপনি জেনে শুনে মিথ্যা বা ভিত্তিহীন অভিযোগ জমা দিতে পারবেন না</li>
              <li>আপনি কোনো ব্যক্তির বিরুদ্ধে ব্যক্তিগত বিদ্বেষবশত রিপোর্ট দিতে পারবেন না</li>
              <li>আপনি কপিরাইটযুক্ত সামগ্রী জমা দিতে পারবেন না</li>
              <li>আপনি স্প্যাম বা বিজ্ঞাপন জমা দিতে পারবেন না</li>
              <li>আপনি হিংসাত্মক বা চরমপন্থী বিষয়বস্তু জমা দিতে পারবেন না</li>
            </ul>
          </Section>

          <Section title="গোপনীয়তা ও পরিচয়">
            <p>
              আমরা আপনার পরিচয় গোপন রাখার জন্য সর্বোচ্চ চেষ্টা করি। কিন্তু আমরা নিশ্চিত করতে পারি না
              যে আইন প্রয়োগকারী সংস্থা বাধ্য করলে আমরা তথ্য দিতে বাধ্য হব না। বর্তমানে আমরা কোনো
              পরিচয় সংরক্ষণ করি না, তাই আমাদের কাছে দেওয়ার মতো তথ্য নেই।
            </p>
          </Section>

          <Section title="মডারেশন ও কন্টেন্ট">
            <p>
              সমস্ত রিপোর্ট একজন মডারেটর দ্বারা যাচাই করা হয়। আমরা যেকোনো সময় যেকোনো রিপোর্ট
              প্রত্যাখ্যান বা মুছে ফেলার অধিকার রাখি। আমরা পাবলিক ফিডে শুধু নাম-বিহীন সারাংশ প্রকাশ করি।
            </p>
          </Section>

          <Section title="দায় সীমাবদ্ধতা">
            <p>
              Nirbhoy কোনো ঘটনার সত্যতা নিশ্চিত করে না। আমরা প্ল্যাটফর্মের মাধ্যমে জমা দেওয়া তথ্যের
              যথার্থতা, সম্পূর্ণতা, বা নির্ভরযোগ্যতার বিষয়ে কোনো ওয়ারেন্টি দিই না। প্ল্যাটফর্মের
              ব্যবহার সম্পূর্ণ আপনার নিজস্ব দায়িত্বে।
            </p>
          </Section>

          <Section title="পরিবর্তন">
            <p>
              আমরা যেকোনো সময় এই শর্তাবলী পরিবর্তন করার অধিকার রাখি। গুরুত্বপূর্ণ পরিবর্তন হলে
              আমরা প্ল্যাটফর্মে নোটিশ দেব। নিয়মিত এই পেজ চেক করার জন্য আমরা উৎসাহিত করি।
            </p>
          </Section>

          <Section title="যোগাযোগ">
            <p>
              শর্তাবলী সম্পর্কিত কোনো প্রশ্ন থাকলে ইমেইল করুন:{' '}
              <span className="text-accent">legal@nirbhoy.app</span>
            </p>
          </Section>
        </div>

        <div className="mt-12 card text-center">
          <p className="font-code text-sm text-text-muted">
            <span className="term-info">$</span> আমাদের{' '}
            <Link href="/privacy" className="text-accent underline underline-offset-2 hover:text-accent-bright">
              গোপনীয়তা নীতি
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