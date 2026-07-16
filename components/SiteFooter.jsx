import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto max-w-5xl px-6 py-10 font-code text-sm text-text-muted">
        <p className="max-w-xl leading-relaxed">
          <span className="term-ok">[ OK ]</span> Nirbhoy কোনো ব্যবহারকারীর নাম, ফোন নম্বর, বা লোকেশন-ডেটা সংগ্রহ করে না। প্রতিটি রিপোর্ট
          প্রকাশের আগে মডারেট করা হয়, যাতে কোনো ব্যক্তির নাম সরাসরি প্রকাশ্যে না আসে।
        </p>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs">
          <Link href="/how-it-works" className="hover:text-accent transition-colors">{'>'} কীভাবে কাজ করে</Link>
          <Link href="/feed" className="hover:text-accent transition-colors">{'>'} জনসাধারণের ফিড</Link>
          <Link href="/admin/login" className="hover:text-accent transition-colors">{'>'} মডারেটর লগইন</Link>
        </div>
        <p className="mt-8 font-terminal text-xs text-text-faint">[ EOF ] © {new Date().getFullYear()} Nirbhoy</p>
      </div>
    </footer>
  );
}