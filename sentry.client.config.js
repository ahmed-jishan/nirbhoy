// This file configures the initialization of Sentry on the client/browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1, // Sample 10% of transactions
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    enabled: process.env.NODE_ENV === "production",
    beforeSend(event) {
      if (process.env.NODE_ENV === "development") return null;
      return event;
    },
    // Don't send PII
    beforeSendTransaction(event) {
      if (process.env.NODE_ENV === "development") return null;
      return event;
    },
  });
}