/**
 * Nirbhoy SEO helpers
 * -------------------
 * Generates Open Graph and Twitter Card meta tag objects for dynamic pages.
 * Defaults are used for static pages (home, about, etc.).
 * Case pages get rich previews with the case title and summary.
 */

interface SeoProps {
  title: string;
  description: string;
  url?: string;
  image?: string;
  type?: "website" | "article";
  siteName?: string;
  locale?: string;
  twitterCard?: "summary" | "summary_large_image";
}

const SITE_NAME = "Nirbhoy";
const DEFAULT_DESCRIPTION =
  "নাম প্রকাশ ছাড়াই আপনার এলাকার সমস্যা ও অভিযোগ জানান। Nirbhoy একটি অ্যানোনিমাস সিভিক কমপ্লেইন্ট ও হুইসেলব্লোয়ার প্ল্যাটফর্ম।";
const DEFAULT_IMAGE = "https://nirbhoy.org/og-image.png";
const SITE_URL = "https://nirbhoy.org";

/**
 * Returns a flat array of <meta> tag props + JSON-LD for the given page.
 * These should be spread into next/head <Head>.
 *
 * Usage in a page:
 *   <Head>
 *     <title>{seo.title}</title>
 *     {buildSeoMeta({ title, description }).map((m, i) =>
 *       m.property
 *         ? <meta key={i} property={m.property} content={m.content} />
 *         : <meta key={i} name={m.name} content={m.content} />
 *     )}
 *   </Head>
 */
export function buildSeoMeta(props: Partial<SeoProps> = {}) {
  const {
    title = SITE_NAME,
    description = DEFAULT_DESCRIPTION,
    url = SITE_URL,
    image = DEFAULT_IMAGE,
    type = "website",
    siteName = SITE_NAME,
    locale = "bn_BD",
    twitterCard = "summary_large_image",
  } = props;

  // Full title with site name suffix (unless it already includes it)
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;

  return [
    // ── Standard meta ────────────────────────────────────────────────
    { name: "description", content: description },

    // ── Open Graph ────────────────────────────────────────────────────
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:image", content: image },
    { property: "og:type", content: type },
    { property: "og:site_name", content: siteName },
    { property: "og:locale", content: locale },

    // ── Twitter Card ──────────────────────────────────────────────────
    { name: "twitter:card", content: twitterCard },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
    { name: "twitter:site", content: "@nirbhoy" },
    { name: "twitter:creator", content: "@nirbhoy" },
  ].filter(Boolean);
}

/**
 * Generates a JSON-LD structured data snippet for a case page.
 * This helps search engines show rich results for case reports.
 */
export function buildCaseJsonLd(caseData: {
  caseId: string;
  title: string;
  summary: string;
  publishedAt: string | null;
  location: string;
}) {
  if (!caseData.publishedAt) return null;

  return {
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Report",
      "@id": `${SITE_URL}/case/${caseData.caseId}`,
      name: caseData.title,
      description: caseData.summary,
      url: `${SITE_URL}/case/${caseData.caseId}`,
      datePublished: caseData.publishedAt,
      identifier: caseData.caseId,
      about: {
        "@type": "Thing",
        name: "Civic Complaint / Whistleblower Report",
      },
      spatialCoverage: {
        "@type": "Place",
        name: caseData.location,
      },
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
      },
    }),
  };
}

/**
 * Social share URLs — constructs platform-specific share links.
 * All links open in a new tab/window.
 */
export function getShareUrls(caseId: string, title: string) {
  const url = `${SITE_URL}/case/${encodeURIComponent(caseId)}`;
  const text = `${title} — দেখুন Nirbhoy-এ`;

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&via=nirbhoy`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    messenger: `fb-messenger://share?link=${encodeURIComponent(url)}`,
    copy: url,
  };
}