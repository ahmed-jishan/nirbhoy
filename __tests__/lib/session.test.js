import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Session (lib/session.js)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe("readCookie", () => {
    it("extracts cookie value from header", async () => {
      const { readCookie } = await import("../../lib/session");
      const req = {
        headers: {
          cookie: "nirbhoy_session=abc123; other=value",
        },
      };
      const result = readCookie(req, "nirbhoy_session");
      expect(result).toBe("abc123");
    });

    it("returns null when cookie header is missing", async () => {
      const { readCookie } = await import("../../lib/session");
      const req = { headers: {} };
      const result = readCookie(req, "nirbhoy_session");
      expect(result).toBeNull();
    });

    it("returns null when cookie is not found", async () => {
      const { readCookie } = await import("../../lib/session");
      const req = {
        headers: {
          cookie: "other=value",
        },
      };
      const result = readCookie(req, "nirbhoy_session");
      expect(result).toBeNull();
    });

    it("handles URL-encoded cookie values", async () => {
      const { readCookie } = await import("../../lib/session");
      const encoded = encodeURIComponent("session-data-123");
      const req = {
        headers: {
          cookie: `nirbhoy_session=${encoded}`,
        },
      };
      const result = readCookie(req, "nirbhoy_session");
      expect(result).toBe("session-data-123");
    });
  });

  describe("sessionCookieHeader", () => {
    it("generates cookie header with correct format", async () => {
      const { sessionCookieHeader } = await import("../../lib/session");
      const header = sessionCookieHeader("test-value", 3600);
      expect(header).toContain("nirbhoy_session=test-value");
      expect(header).toContain("HttpOnly");
      expect(header).toContain("Path=/");
      expect(header).toContain("SameSite=Lax");
      expect(header).toContain("Max-Age=3600");
    });

    it("adds Secure flag in production", async () => {
      process.env.NODE_ENV = "production";
      const { sessionCookieHeader } = await import("../../lib/session");
      const header = sessionCookieHeader("test", 3600);
      expect(header).toContain("Secure");
    });
  });

  describe("clearSessionCookieHeader", () => {
    it("generates a cookie header to clear the session", async () => {
      const { clearSessionCookieHeader } = await import("../../lib/session");
      const header = clearSessionCookieHeader();
      expect(header).toContain("Max-Age=0");
    });
  });
});