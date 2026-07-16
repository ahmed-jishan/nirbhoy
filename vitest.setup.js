// Mock pino logger for testing
// This avoids pino initialization issues in the test environment
import { vi } from "vitest";

// Required env vars for lib files that validateEnv at import
process.env.FIREBASE_PROJECT_ID = "test-project";
process.env.FIREBASE_CLIENT_EMAIL = "test@test.com";
process.env.FIREBASE_PRIVATE_KEY = "test-key";
process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-api-key";
process.env.CLOUDINARY_API_SECRET = "test-api-secret";
process.env.NODE_ENV = "test";

vi.mock("pino", () => {
  return {
    default: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      fatal: vi.fn(),
      child: vi.fn(() => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        fatal: vi.fn(),
      })),
    }),
  };
});

// Mock pino-pretty
vi.mock("pino-pretty", () => ({
  default: vi.fn(),
}));

// Mock next/config for any Next.js config imports
vi.mock("next/config", () => ({
  default: () => ({
    publicRuntimeConfig: {},
    serverRuntimeConfig: {},
  }),
}));