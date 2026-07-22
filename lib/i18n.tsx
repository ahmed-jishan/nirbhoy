import { createContext, useContext, useEffect, useState, ReactNode } from "react";

/**
 * Nirbhoy i18n
 * ------------
 * Ultra-light, dependency-free i18n. Two languages: Bangla (default) and
 * English. Language choice is stored in localStorage so it persists across
 * visits.
 *
 * Usage:
 *   const { t, lang, setLang } = useI18n();
 *   <h1>{t("home.title")}</h1>
 *
 * If a key is missing in a language, we fall back to Bangla so nothing is
 * ever a blank string on screen.
 */

export type Lang = "bn" | "en";

const STORAGE_KEY = "nirbhoy:lang";

const DICT: Record<string, { bn: string; en: string }> = {
  // ── Navigation ─────────────────────────────────────────────────────
  "nav.feed": { bn: "ফিড", en: "Feed" },
  "nav.stats": { bn: "পরিসংখ্যান", en: "Stats" },
  "nav.track": { bn: "স্ট্যাটাস", en: "Track" },
  "nav.how": { bn: "কীভাবে", en: "How it works" },
  "nav.submit": { bn: "[ রিপোর্ট করুন ]", en: "[ Report ]" },
  "nav.safety": { bn: "নিরাপত্তা", en: "Safety" },
  "nav.menu": { bn: "মেনু", en: "Menu" },
  "nav.language": { bn: "ভাষা", en: "Language" },
  "nav.langBn": { bn: "বাং", en: "BN" },
  "nav.langEn": { bn: "EN", en: "EN" },

  // ── Home page ──────────────────────────────────────────────────────
  "home.title.line1": { bn: "যা দেখেছেন, বলুন", en: "Speak up" },
  "home.title.line2": { bn: "নাম প্রকাশ ছাড়াই।", en: "anonymously." },
  "home.subtitle": {
    bn: "গ্রামে বা এলাকায় কিছু ভুল ঘটতে দেখলে, প্রমাণ থাকলেও প্রায়ই সরাসরি বলার সাহস হয় না। Nirbhoy-এ আপনি সম্পূর্ণ পরিচয়গোপনে রিপোর্ট জমা দিতে পারবেন — কোনো নাম, ফোন নম্বর বা লোকেশন সংরক্ষণ করা হয় না।",
    en: "When something goes wrong in your neighborhood, speaking up publicly can feel risky — even when you have proof. On Nirbhoy you can submit reports fully anonymously — we never store your name, phone number or precise location.",
  },
  "home.cta.submit": { bn: "একটি রিপোর্ট জমা দিন", en: "Submit a report" },
  "home.cta.feed": { bn: "[ ফিড দেখুন ]", en: "[ View feed ]" },
  "home.tagline.note": {
    bn: "প্রতিটি রিপোর্ট একটি কেস নম্বর পায় — যাতে নাম ছাড়াই আপনি পরে অবস্থা যাচাই করতে পারেন।",
    en: "Every report gets a case number — so you can check its status later without revealing your identity.",
  },
  "home.trust.title": { bn: "এটি কীভাবে নিরাপদ রাখে", en: "How we keep you safe" },
  "home.trust.card1.title": { bn: "সরাসরি প্রকাশ হয় না", en: "Nothing is published raw" },
  "home.trust.card1.body": {
    bn: "আপনার রিপোর্ট আগে একজন যাচাইকারী দেখেন। কোনো ব্যক্তির নাম কখনোই পাবলিক ফিডে প্রকাশ করা হয় না — শুধু ঘটনার সারাংশ।",
    en: "Every report is reviewed by a moderator first. No individual's name is ever shown on the public feed — only a summary of the incident.",
  },
  "home.trust.card2.title": { bn: "কোনো পরিচয় সংরক্ষণ হয় না", en: "No identity is stored" },
  "home.trust.card2.body": {
    bn: "আমরা আপনার নাম, ফোন নম্বর, বা নির্ভুল লোকেশন সংগ্রহ করি না। শুধু একটি কেস নম্বর দেওয়া হয়।",
    en: "We never collect your name, phone number, or exact location. You only receive a case number.",
  },
  "home.trust.card3.title": { bn: "প্রমাণ সুরক্ষিত থাকে", en: "Evidence stays protected" },
  "home.trust.card3.body": {
    bn: "ছবি বা ভিডিও প্রমাণ এনক্রিপ্টেড ও প্রাইভেট থাকে — শুধু অনুমোদিত মডারেটর যাচাইয়ের জন্য দেখতে পারেন।",
    en: "Photos and videos stay encrypted and private — only authorised moderators can view them for verification.",
  },
  "home.demo.title": { bn: "যাচাই চলছে", en: "Reviewing" },
  "home.demo.identity": { bn: "পরিচয় গোপন", en: "Identity hidden" },

  // ── Common ─────────────────────────────────────────────────────────
  "common.loading": { bn: "লোড হচ্ছে…", en: "Loading…" },
  "common.error": { bn: "একটি ত্রুটি হয়েছে", en: "An error occurred" },
  "common.back": { bn: "ফিরুন", en: "Back" },
  "common.close": { bn: "বন্ধ", en: "Close" },
  "common.save": { bn: "সংরক্ষণ", en: "Save" },
  "common.cancel": { bn: "বাতিল", en: "Cancel" },
  "common.tryAgain": { bn: "আবার চেষ্টা করুন", en: "Try again" },

  // ── Feed ───────────────────────────────────────────────────────────
  "feed.title": { bn: "জনসাধারণের ফিড", en: "Public feed" },
  "feed.subtitle": {
    bn: "এখানে শুধু যাচাইকৃত ও মডারেট করা সারাংশ দেখানো হয় — কোনো ব্যক্তির নাম কখনোই দেখানো হয় না।",
    en: "Only verified, moderated summaries are shown here — no individual's name is ever displayed.",
  },
  "feed.search": {
    bn: "শিরোনাম, কেস নম্বর, বা লোকেশন অনুসারে খুঁজুন...",
    en: "Search by title, case ID, or location...",
  },
  "feed.filter.all": { bn: "সব", en: "All" },
  "feed.filter.incident": { bn: "অপরাধ / ঘটনা", en: "Incident" },
  "feed.filter.grievance": { bn: "সাধারণ অভিযোগ", en: "Grievance" },
  "feed.filter.allDistricts": { bn: "সব জেলা", en: "All districts" },
  "feed.filter.anyLevel": { bn: "যেকোনো স্তর", en: "Any precision" },
  "feed.precision.exact": { bn: "সঠিক অবস্থান", en: "Exact location" },
  "feed.precision.street": { bn: "রাস্তা স্তর", en: "Street level" },
  "feed.precision.thana": { bn: "থানা স্তর", en: "Thana level" },
  "feed.precision.district": { bn: "জেলা স্তর", en: "District level" },
  "feed.precision.badge.exact": { bn: "সঠিক", en: "Exact" },
  "feed.precision.badge.street": { bn: "রাস্তা", en: "Street" },
  "feed.precision.badge.thana": { bn: "থানা", en: "Thana" },
  "feed.precision.badge.district": { bn: "জেলা", en: "District" },
  "feed.clearFilter": { bn: "✕ ফিল্টার", en: "✕ Clear" },
  "feed.view.list": { bn: "তালিকা", en: "List" },
  "feed.view.map": { bn: "মানচিত্র", en: "Map" },
  "feed.map.withLocation": { bn: "লোকেশন সহ রিপোর্ট", en: "Reports with location" },
  "feed.map.exactCount": { bn: "সঠিক অবস্থান", en: "exact locations" },
  "feed.map.view3d": { bn: "৩ডি ভিউ দেখুন", en: "View in 3D" },
  "feed.map.view3dTitle": { bn: "৩ডি মানচিত্রে দেখুন", en: "View on 3D map" },
  "feed.empty.none": { bn: "এখনো কোনো প্রকাশিত রিপোর্ট নেই।", en: "No published reports yet." },
  "feed.empty.filtered": { bn: "এই ফিল্টারে কোনো রিপোর্ট নেই।", en: "No reports match this filter." },
  "feed.empty.map": {
    bn: "এই ফিল্টারে মানচিত্রে দেখানোর মতো কোনো রিপোর্ট নেই।",
    en: "No reports with a location match this filter.",
  },
  "feed.locationMissing": { bn: "স্থান উল্লেখ নেই", en: "Location not provided" },
  "feed.viewTimeline": { bn: "টাইমলাইন দেখুন →", en: "View timeline →" },
  "feed.summaryLine": {
    bn: "মোট {total}টি · ফিল্টারে {filtered}টি · মানচিত্রে {mapped}টি",
    en: "Total {total} · filtered {filtered} · on map {mapped}",
  },

  // ── Case page ──────────────────────────────────────────────────────
  "case.notFound": {
    bn: "এই কেস আইডি দিয়ে কোনো প্রকাশিত রিপোর্ট পাওয়া যায়নি।",
    en: "No published report was found with this case ID.",
  },
  "case.tryAnother": { bn: "অন্য কেস আইডি চেষ্টা করুন", en: "Try another case ID" },
  "case.location": { bn: "location", en: "location" },
  "case.published": { bn: "published", en: "published" },
  "case.locationMissing": { bn: "উল্লেখ নেই", en: "Not provided" },
  "case.share": { bn: "শেয়ার লিংক কপি", en: "Copy share link" },
  "case.shareCopied": { bn: "✓ কপি হয়েছে", en: "✓ Copied" },
  "case.pdf": { bn: "PDF হিসেবে সেভ করুন", en: "Save as PDF" },
  "case.backToFeed": { bn: "ফিডে ফিরুন", en: "Back to feed" },
  "case.timeline": { bn: "কেস টাইমলাইন", en: "Case timeline" },
  "case.timelineIntro": {
    bn: "এই কেসটি নিয়ে মডারেটরদের প্রকাশ্য আপডেটগুলো নিচে দেখানো হয়েছে।",
    en: "Public updates from moderators about this case are shown below.",
  },
  "case.type.incident": { bn: "অপরাধ / ঘটনা", en: "Incident" },
  "case.type.grievance": { bn: "সাধারণ অভিযোগ", en: "Grievance" },

  // ── Timeline (component) ───────────────────────────────────────────
  "timeline.empty": { bn: "এখনো কোনো আপডেট যোগ করা হয়নি।", en: "No updates have been posted yet." },
  "timeline.publishedOn": { bn: "কেসটি প্রকাশিত হয়েছে", en: "case was published" },
  "timeline.published": { bn: "কেস প্রকাশিত", en: "case published" },
  "timeline.private": { bn: "প্রাইভেট", en: "PRIVATE" },
  "timeline.author": { bn: "author", en: "author" },
  "timeline.delete": { bn: "✕ আপডেট মুছুন", en: "✕ Delete update" },
  "timeline.type.info": { bn: "তথ্য", en: "Info" },
  "timeline.type.action": { bn: "পদক্ষেপ", en: "Action" },
  "timeline.type.resolved": { bn: "সমাধান হয়েছে", en: "Resolved" },
  "timeline.type.escalated": { bn: "এসকেলেট", en: "Escalated" },

  // ── Upvote ─────────────────────────────────────────────────────────
  "vote.support": { bn: "সমর্থন", en: "Support" },
  "vote.supported": { bn: "গুরুত্বপূর্ণ", en: "Important" },
  "vote.titleMark": { bn: "গুরুত্বপূর্ণ চিহ্নিত করুন", en: "Mark as important" },
  "vote.titleUnmark": { bn: "ভোট প্রত্যাহার করুন", en: "Withdraw vote" },
  "vote.error": { bn: "ভোট দেওয়া যায়নি", en: "Vote could not be recorded" },

  // ── Footer ─────────────────────────────────────────────────────────
  "footer.blurb": {
    bn: "Nirbhoy কোনো ব্যবহারকারীর নাম, ফোন নম্বর, বা লোকেশন-ডেটা সংগ্রহ করে না। প্রতিটি রিপোর্ট প্রকাশের আগে মডারেট করা হয়, যাতে কোনো ব্যক্তির নাম সরাসরি প্রকাশ্যে না আসে।",
    en: "Nirbhoy never collects users' names, phone numbers, or location data. Every report is moderated before publication so no individual is named publicly.",
  },
  "footer.how": { bn: "কীভাবে কাজ করে", en: "How it works" },
  "footer.safety": { bn: "নিরাপত্তা গাইড", en: "Safety guide" },
  "footer.feed": { bn: "জনসাধারণের ফিড", en: "Public feed" },
  "footer.stats": { bn: "পরিসংখ্যান", en: "Statistics" },
  "footer.faq": { bn: "জিজ্ঞাসা", en: "FAQ" },
  "footer.privacy": { bn: "গোপনীয়তা", en: "Privacy" },
  "footer.terms": { bn: "শর্তাবলী", en: "Terms" },
  "footer.adminLogin": { bn: "মডারেটর লগইন", en: "Moderator login" },
};

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: "bn",
  setLang: (_l: Lang) => {
    // no-op default — real implementation lives in I18nProvider
    void _l;
  },
  t: (_key: string, _vars?: Record<string, string | number>) => {
    void _vars;
    return DICT[_key] ? DICT[_key].bn : _key;
  },
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("bn");

  // Hydrate from localStorage on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved === "bn" || saved === "en") {
        setLangState(saved);
        document.documentElement.lang = saved;
      }
    } catch {
      /* ignore */
    }
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
      // Reflect on <html lang> so screen readers / browser features
      // switch reading language.
      document.documentElement.lang = l;
    } catch {
      /* ignore */
    }
  }

  function t(key: string, vars?: Record<string, string | number>) {
    const entry = DICT[key];
    if (!entry) return key; // developer aid: surface missing keys
    let out = entry[lang] || entry.bn || key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        out = out.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return out;
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

/**
 * LanguageToggle — a compact "BN | EN" switch that flips the active
 * language. Safe to use anywhere inside <I18nProvider>. Keeps its own
 * styling minimal so it can live in headers, footers, mobile menus.
 */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return (
    <div
      role="group"
      aria-label={lang === "bn" ? "ভাষা নির্বাচন" : "Language selector"}
      className={`inline-flex items-center rounded-md border border-borderStrong bg-elevated/80 p-0.5 font-terminal text-[10px] ${className}`}
    >
      <button
        type="button"
        onClick={() => setLang("bn")}
        aria-pressed={lang === "bn"}
        className={`rounded-sm px-2 py-1 transition-colors ${
          lang === "bn"
            ? "bg-accent text-bg"
            : "text-text-muted hover:text-text-primary"
        }`}
      >
        বাং
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`rounded-sm px-2 py-1 transition-colors ${
          lang === "en"
            ? "bg-accent text-bg"
            : "text-text-muted hover:text-text-primary"
        }`}
      >
        EN
      </button>
    </div>
  );
}
