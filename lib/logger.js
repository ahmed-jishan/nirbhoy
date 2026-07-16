/**
 * Centralized logger for Nirbhoy
 *
 * Uses pino for structured JSON logging in production,
 * with pino-pretty for readable output in development.
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
    paths: ["req.headers.cookie", "req.headers.authorization", "body.captchaToken", "body.password"],
    censor: "[REDACTED]",
  },
});