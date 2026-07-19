import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="bn">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=VT323&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <meta name="description" content="Nirbhoy — নিরাপদে, নাম প্রকাশ ছাড়াই আপনার এলাকার সমস্যা তুলে ধরুন।" />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}