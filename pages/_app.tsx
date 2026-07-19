import Script from "next/script";
import "../styles/globals.css";
import { ToastProvider } from "../components/Toast";
import ErrorBoundary from "../components/ErrorBoundary";

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <ToastProvider>
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
      </ToastProvider>
    </ErrorBoundary>
  );
}
