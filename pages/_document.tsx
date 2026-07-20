import { Html, Head, Main, NextScript } from "next/document";

/**
 * Custom Document.
 *
 * Note: Google Fonts CDN links have been removed. Fonts are loaded via
 * `next/font/google` in `pages/_app.tsx`, which self-hosts the font files
 * at build time. This prevents leaking any visitor's IP to Google.
 */
export default function Document() {
  return (
    <Html lang="bn">
      <Head>
        <meta
          name="description"
          content="Nirbhoy — নিরাপদে, নাম প্রকাশ ছাড়াই আপনার এলাকার সমস্যা তুলে ধরুন।"
        />
        <link rel="icon" href="/favicon.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0D9488" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Nirbhoy" />
        {/* Explicitly disable referrer so outbound links don't leak the
            reporter's current URL (which may contain a case ID). */}
        <meta name="referrer" content="no-referrer" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
