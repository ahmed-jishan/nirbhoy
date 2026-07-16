import { describe, it, expect, vi, beforeEach } from "vitest";

describe("CAPTCHA (lib/captcha.js)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe("getTurnstileSiteKey", () => {
    it("returns empty string when env var is not set", async () => {
      delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
      const { getTurnstileSiteKey } = await import("../../lib/captcha");
      expect(getTurnstileSiteKey()).toBe("");
    });

    it("returns the site key when set", async () => {
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "0x4AAAAAAA-test";
      const { getTurnstileSiteKey } = await import("../../lib/captcha");
      expect(getTurnstileSiteKey()).toBe("0x4AAAAAAA-test");
    });
  });

  describe("verifyTurnstileToken", () => {
    it("returns true when secret key is not configured (dev mode)", async () => {
      delete process.env.TURNSTILE_SECRET_KEY;
      const { verifyTurnstileToken } = await import("../../lib/captcha");
      const result = await verifyTurnstileToken("some-token");
      expect(result).toBe(true);
    });

    it("returns false when no token is provided", async () => {
      process.env.TURNSTILE_SECRET_KEY = "test-secret";
      const { verifyTurnstileToken } = await import("../../lib/captcha");
      const result = await verifyTurnstileToken(null);
      expect(result).toBe(false);
    });

    it("returns false when token is empty string", async () => {
      process.env.TURNSTILE_SECRET_KEY = "test-secret";
      const { verifyTurnstileToken } = await import("../../lib/captcha");
      const result = await verifyTurnstileToken("");
      expect(result).toBe(false);
    });
  });
});