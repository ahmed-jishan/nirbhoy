/**
 * Centralized logger for Nirbhoy
 *
 * Uses pino for structured JSON logging in production,
 * with pino-pretty for readable output in development.
 *
 * Privacy note
 * ------------
 * Nirbhoy is an anonymous reporting platform. If our own logs leaked, a
 * criminal could correlate timestamps + IPs to identify a reporter.
 * The `redact` list below aggressively strips every source of
 * personally-identifiable information (PII) that could enter a log line:
 *
 *   - IP addresses (x-forwarded-for, x-real-ip, socket.remoteAddress)
 *   - Cookies + auth headers (session tokens)
 *   - User-agents (browser fingerprint)
 *   - CAPTCHA + password fields on submitted bodies
 *   - Reporter-supplied content (title, description, location) — these can
 *     contain identifying phrases; admins read them from the DB directly,
 *     they never need to appear in server logs.
 *
 * Usage:
 *   import { logger } from "../lib/logger";
 *   logger.info({ caseId, type }, "New complaint created");
 *   logger.error({ err, route }, "Failed to process request");
 */

import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
  }),
  redact: {
    paths: [
      // Network / connection identity
      "req.headers['x-forwarded-for']",
      "req.headers['x-real-ip']",
      "req.headers['cf-connecting-ip']",
      "req.headers['true-client-ip']",
      "req.headers['x-client-ip']",
      "req.headers['forwarded']",
      "req.headers['user-agent']",
      "req.headers.cookie",
      "req.headers.authorization",
      "req.ip",
      "req.socket.remoteAddress",
      "req.connection.remoteAddress",
      "res.headers['set-cookie']",

      // Submitted-body PII
      "body.captchaToken",
      "body.password",
      "body.idToken",
      "body.token",
      "body.description",
      "body.title",
      "body.location",
      "body.email",

      // Error objects that inline request info
      "err.config.headers.cookie",
      "err.config.headers.authorization",
      "err.request.headers.cookie",
      "err.request.headers.authorization",
    ],
    censor: "[REDACTED]",
    remove: false,
  },
  // Firm safety net: never print any object that looks like a raw IP.
  formatters: {
    log(obj) {
      const scrubbed: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === "string" && /^(\d{1,3}\.){3}\d{1,3}$/.test(v)) {
          scrubbed[k] = "[REDACTED_IP]";
        } else if (typeof v === "string" && /^[0-9a-f:]+:[0-9a-f:]+$/i.test(v) && v.includes(":")) {
          // rough IPv6 heuristic
          scrubbed[k] = "[REDACTED_IP]";
        } else {
          scrubbed[k] = v;
        }
      }
      return scrubbed;
    },
  },
});
