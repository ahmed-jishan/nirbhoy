export default function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto max-w-5xl px-6 py-10 font-body text-sm text-text-muted">
        <p className="max-w-xl leading-relaxed">
          Nirbhoy কোনো ব্যবহারকারীর নাম, ফোন নম্বর, বা লোকেশন-ডেটা সংগ্রহ করে না। প্রতিটি রিপোর্ট
          প্রকাশের আগে মডারেট করা হয়, যাতে কোনো ব্যক্তির নাম সরাসরি প্রকাশ্যে না আসে।
        </p>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
          <a href="/how-it-works" className="hover:text-text-primary">কীভাবে কাজ করে</a>
          <a href="/feed" className="hover:text-text-primary">জনসাধারণের ফিড</a>
          <a href="/admin/login" className="hover:text-text-primary">মডারেটর লগইন</a>
        </div>
        <p className="mt-8 font-mono text-xs text-text-faint">© {new Date().getFullYear()} Nirbhoy</p>
      </div>
    </footer>
  );
}
