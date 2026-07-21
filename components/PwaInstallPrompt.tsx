import { useState, useEffect } from "react";

/**
 * PwaInstallPrompt — Shows an in-app banner prompting the user to install
 * the Nirbhoy PWA. Supports:
 *   - Chrome/Samsung: beforeinstallprompt event (native prompt)
 *   - iOS Safari: custom instructions (as a fallback)
 *   - Other browsers: dismissed silently
 *
 * The banner auto-hides after the user accepts, declines, or after 7 days.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "nirbhoy:pwa-dismissed";
const INSTALLED_KEY = "nirbhoy:pwa-installed";

export default function PwaInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsStandalone(true);
      return;
    }

    // Check if previously dismissed
    try {
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      if (dismissed) {
        const dismissedAt = parseInt(dismissed, 10);
        // Re-show after 7 days
        if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
      }
      const installed = localStorage.getItem(INSTALLED_KEY);
      if (installed) return;
    } catch { /* ignore */ }

    // Detect iOS Safari
    const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const safari = /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent);
    setIsIOS(iOS && safari);

    // Listen for beforeinstallprompt (Chrome, Samsung, Edge Android)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // For iOS, show custom instructions after a short delay
    if (iOS && safari) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Don't show if already installed or no prompt needed
  if (isStandalone) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;

    // Show the native install prompt
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      try { localStorage.setItem(INSTALLED_KEY, "true"); } catch { /* ignore */ }
      setShowPrompt(false);
    }
    // If dismissed, we'll re-prompt on next page load
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setShowPrompt(false);
    try { localStorage.setItem(DISMISSED_KEY, String(Date.now())); } catch { /* ignore */ }
  }

  function handleDismissIOS() {
    setShowPrompt(false);
    try { localStorage.setItem(DISMISSED_KEY, String(Date.now())); } catch { /* ignore */ }
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm animate-fade-in-up">
      <div className="rounded-md border border-accent/30 bg-elevated p-4 shadow-lg shadow-accent-glow/20">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {isIOS ? (
              <>
                <p className="font-code text-sm font-semibold text-text-primary">
                  Nirbhoy অ্যাপ ইন্সটল করুন
                </p>
                <ol className="mt-2 font-code text-xs leading-relaxed text-text-muted list-decimal list-inside space-y-1">
                  <li>শেয়ার বাটনে ট্যাপ করুন <span className="text-accent">⎙</span></li>
                  <li>স্ক্রিনে যোগ করুন <span className="text-accent">&ldquo;হোম স্ক্রিনে যোগ করুন&rdquo;</span></li>
                </ol>
              </>
            ) : deferredPrompt ? (
              <>
                <p className="font-code text-sm font-semibold text-text-primary">
                  Nirbhoy অ্যাপ ইন্সটল করুন
                </p>
                <p className="mt-1 font-code text-xs text-text-muted">
                  দ্রুত অ্যাক্সেস ও অফলাইন সাপোর্টের জন্য হোম স্ক্রিনে যোগ করুন।
                </p>
              </>
            ) : (
              <>
                <p className="font-code text-sm font-semibold text-text-primary">
                  Nirbhoy অ্যাপ ইন্সটল করুন
                </p>
                <p className="mt-1 font-code text-xs text-text-muted">
                  আপনার ব্রাউজার মেনু থেকে <span className="text-accent">&ldquo;হোম স্ক্রিনে যোগ করুন&rdquo;</span> নির্বাচন করুন।
                </p>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={isIOS ? handleDismissIOS : handleDismiss}
            className="shrink-0 rounded-md p-1 text-text-faint hover:text-text-primary transition-colors"
            aria-label="বন্ধ"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          {deferredPrompt && !isIOS && (
            <button
              type="button"
              onClick={handleInstall}
              className="btn-primary !py-2 !px-4 text-xs flex-1"
            >
              $ ইন্সটল করুন
            </button>
          )}
          {!isIOS && (
            <button
              type="button"
              onClick={handleDismiss}
              className="btn-secondary !py-2 !px-4 text-xs flex-1"
            >
              এখন নয়
            </button>
          )}
          {isIOS && (
            <button
              type="button"
              onClick={handleDismissIOS}
              className="btn-secondary !py-2 !px-4 text-xs flex-1"
            >
              বুঝেছি
            </button>
          )}
        </div>
      </div>
    </div>
  );
}