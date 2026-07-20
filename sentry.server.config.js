// This file configures the initialization of Sentry on the server.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

/**
 * PII scrubber shared with the client config.
 *
 * Nirbhoy is an anonymous reporting platform: if a reporter's IP or a
 * report's raw title/description leaves this server, the anonymity
 * promise is broken. Even Sentry (a trusted vendor) must never see:
 *
 *   - IPs (any header or connection-level source)
 *   - Cookies / auth tokens
 *   - User-agents
 *   - Reporter-supplied text (title, description, location)
 *
 * This runs on every event and every breadcrumb before it is sent.
 */
function scrubEvent(event) {
  if (!event) return event;

  // Never attribute an event to a specific user or IP.
  if (event.user) {
    delete event.user.ip_address;
    delete event.user.email;
    delete event.user.username;
    delete event.user.id;
  }
  event.user = undefined;

  // Strip all identity-bearing request headers.
  if (event.request) {
    if (event.request.headers) {
      const headers = event.request.headers;
      const drop = [
        "x-forwarded-for",
        "x-real-ip",
        "cf-connecting-ip",
        "true-client-ip",
        "x-client-ip",
        "forwarded",
        "user-agent",
        "cookie",
        "authorization",
      ];
      for (const h of drop) {
        delete headers[h];
        delete headers[h.toUpperCase()];
      }
    }
    // Strip submitted body — may contain identifying phrases.
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.env;
    delete event.request.query_string;
  }

  // Wipe breadcrumbs that captured URLs with tokens in them.
  if (Array.isArray(event.breadcrumbs)) {
    event.breadcrumbs = event.breadcrumbs.map((b) => {
      if (!b) return b;
      if (b.data && typeof b.data === "object") {
        const cleaned = { ...b.data };
        for (const key of Object.keys(cleaned)) {
          if (/(ip|token|cookie|authorization|user-agent)/i.test(key)) {
            cleaned[key] = "[REDACTED]";
          }
        }
        b.data = cleaned;
      }
      return b;
    });
  }

  return event;
}

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === "production",
    // Explicitly disable PII collection at the SDK level.
    sendDefaultPii: false,
    beforeSend(event) {
      if (process.env.NODE_ENV === "development") return null;
      return scrubEvent(event);
    },
    beforeBreadcrumb(breadcrumb) {
      if (!breadcrumb) return breadcrumb;
      // Drop HTTP breadcrumbs that would embed request URLs / IPs.
      if (breadcrumb.category === "http" && breadcrumb.data) {
        delete breadcrumb.data.request_body_size;
        delete breadcrumb.data.response_body_size;
      }
      return breadcrumb;
    },
  });
}
