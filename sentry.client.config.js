// This file configures the initialization of Sentry on the client/browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

/**
 * Aggressive PII scrubber for browser-originated events.
 *
 * On the client Sentry can pick up:
 *   - The visitor's IP (via Sentry ingestion — we disable this)
 *   - localStorage/session cookies via replays
 *   - URL query-strings that may contain case IDs or search terms
 *   - User-agent + device fingerprint
 *
 * We strip all of that and disable session replay entirely so browser
 * activity never leaves the device.
 */
function scrubEvent(event) {
  if (!event) return event;

  if (event.user) {
    delete event.user.ip_address;
    delete event.user.email;
    delete event.user.username;
    delete event.user.id;
  }
  event.user = undefined;

  if (event.request) {
    if (event.request.headers) {
      const drop = [
        "x-forwarded-for",
        "x-real-ip",
        "cf-connecting-ip",
        "true-client-ip",
        "user-agent",
        "cookie",
        "authorization",
        "referer",
      ];
      for (const h of drop) {
        delete event.request.headers[h];
        delete event.request.headers[h.toUpperCase()];
      }
    }
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.query_string;
  }

  // Remove case-id fragments from URLs so a leaked event can't be
  // correlated back to a specific report.
  if (event.request && typeof event.request.url === "string") {
    event.request.url = event.request.url
      .replace(/\/case\/[^/?#]+/g, "/case/[redacted]")
      .replace(/token=[^&#]+/g, "token=[redacted]");
  }

  return event;
}

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1,
    // Session replay records DOM — disable for a whistleblower app.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    enabled: process.env.NODE_ENV === "production",
    sendDefaultPii: false,
    beforeSend(event) {
      if (process.env.NODE_ENV === "development") return null;
      return scrubEvent(event);
    },
    beforeSendTransaction(event) {
      if (process.env.NODE_ENV === "development") return null;
      return scrubEvent(event);
    },
    beforeBreadcrumb(breadcrumb) {
      if (!breadcrumb) return breadcrumb;
      // Drop breadcrumbs that carry navigation URLs / form data.
      if (breadcrumb.category === "navigation" && breadcrumb.data) {
        if (typeof breadcrumb.data.from === "string") {
          breadcrumb.data.from = breadcrumb.data.from.replace(/\/case\/[^/?#]+/g, "/case/[redacted]");
        }
        if (typeof breadcrumb.data.to === "string") {
          breadcrumb.data.to = breadcrumb.data.to.replace(/\/case\/[^/?#]+/g, "/case/[redacted]");
        }
      }
      if (breadcrumb.category === "ui.input") {
        // Form field values would leak here — drop them.
        return null;
      }
      return breadcrumb;
    },
  });
}
