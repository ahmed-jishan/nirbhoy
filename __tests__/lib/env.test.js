import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Environment Validation (lib/env.js)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("throws error when required vars are missing", async () => {
    // Clear required vars
    const originalEnv = { ...process.env };
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;

    const { validateEnv } = await import("../../lib/env");
    expect(() => validateEnv()).toThrow("Missing required environment variables");

    // Restore
    Object.assign(process.env, originalEnv);
  });

  it("passes when all required vars are present", async () => {
    process.env.FIREBASE_PROJECT_ID = "test-project";
    process.env.FIREBASE_CLIENT_EMAIL = "test@test.com";
    process.env.FIREBASE_PRIVATE_KEY = "test-key";
    process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
    process.env.CLOUDINARY_API_KEY = "test-api-key";
    process.env.CLOUDINARY_API_SECRET = "test-api-secret";

    const { validateEnv } = await import("../../lib/env");
    expect(() => validateEnv()).not.toThrow();
  });

  it("calling validateEnv twice does not throw", async () => {
    process.env.FIREBASE_PROJECT_ID = "test-project";
    process.env.FIREBASE_CLIENT_EMAIL = "test@test.com";
    process.env.FIREBASE_PRIVATE_KEY = "test-key";
    process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
    process.env.CLOUDINARY_API_KEY = "test-api-key";
    process.env.CLOUDINARY_API_SECRET = "test-api-secret";

    const { validateEnv } = await import("../../lib/env");
    validateEnv(); // First call
    expect(() => validateEnv()).not.toThrow(); // Second call should be no-op
  });
});