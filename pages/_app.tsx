import Script from "next/script";
import { Space_Grotesk, VT323, JetBrains_Mono } from "next/font/google";
import "../styles/globals.css";
import { ToastProvider } from "../components/Toast";
import ErrorBoundary from "../components/ErrorBoundary";
import { I18nProvider } from "../lib/i18n";

/**
 * Self-hosted Google Fonts.
 *
 * `next/font/google` downloads the font files at build time and serves
 * them from our own origin. This closes a fingerprinting leak: with the
 * old `<link href="fonts.googleapis.com">` approach, every visitor's IP
 * was sent to Google on page load — a paper trail that a subpoena or
 * data leak could correlate with the timestamp of a submission.
 *
 * The `variable` output makes the fonts available via CSS variables so
 * Tailwind's font-family classes keep working without any change to
 * component code.
 */
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const vt323 = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-vt323",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <ToastProvider>
          <div
            className={`${spaceGrotesk.variable} ${vt323.variable} ${jetbrainsMono.variable}`}
            style={{ display: "contents" }}
          >
            {/* Cloudflare Turnstile CAPTCHA widget */}
            {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
              <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js"
                async
                defer
                strategy="afterInteractive"
              />
            )}
            <Component {...pageProps} />
          </div>
        </ToastProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}
