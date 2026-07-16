// This file configures the initialization of Sentry on the server.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1, // Sample 10% of transactions in production
    enabled: process.env.NODE_ENV === "production",
    // Only capture errors, not debug/warn messages
    beforeSend(event) {
      // Don't send errors in development unless it's a critical API error
      if (process.env.NODE_ENV === "development") return null;
      return event;
    },
  });
}