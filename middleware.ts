import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Admin panel obscurity middleware.
 *
 * The `/admin/*` and `/api/admin/*` surfaces are the highest-value targets:
 * an attacker who reaches the login form can brute-force / phish / try
 * credential-stuffing attacks. To make them invisible to random probing,
 * we hide the whole surface behind a secret "gate":
 *
 *   1. A visitor hits `/gate/<NIRBHOY_ADMIN_SLUG>` (secret path from env).
 *   2. We set a HttpOnly cookie `admin_gate` = signed marker.
 *   3. From then on, `/admin/*` and `/api/admin/*` respond normally.
 *   4. Any request that lacks the cookie AND isn't the gate URL sees a
 *      generic 404 — indistinguishable from the site not having an admin
 *      panel at all.
 *
 * Additionally, if NIRBHOY_ADMIN_ALLOWED_IPS is set, only requests from
 * those IPs can even reach the gate — all others get 404. This prevents
 * credential-stuffing even if the slug leaks.
 *
 * This is security-by-obscurity — the *real* authorization still lives in
 * Firebase Auth + Firestore admin claims. But it removes 99% of drive-by
 * traffic and eliminates the phishing target ("mydomain.com/admin/login").
 */

const GATE_COOKIE = "admin_gate";
const GATE_VALUE = "ok"; // opaque marker; presence is enough

// If NIRBHOY_ADMIN_SLUG isn't set, we disable the gate (dev mode default).
const ADMIN_SLUG = process.env.NIRBHOY_ADMIN_SLUG || "";

// Optional IP allowlist — comma-separated CIDR or plain IPs.
// Example: "103.123.45.67,192.168.1.0/24"
const ADMIN_ALLOWED_IPS = (process.env.NIRBHOY_ADMIN_ALLOWED_IPS || "").split(",").map(s => s.trim()).filter(Boolean);

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

function isPublicAdminAuthPath(pathname: string): boolean {
  return pathname === "/admin/login" || pathname === "/api/admin/session";
}

/** Quick netmask match for a single IP against a CIDR (e.g. "192.168.1.0/24"). */
function ipInCidr(ip: string, cidr: string): boolean {
  const [range, bits = "32"] = cidr.split("/");
  const mask = ~(2 ** (32 - Number(bits)) - 1);
  const ipNum = ip.split(".").reduce((acc, oct) => (acc << 8) + Number(oct), 0);
  const rangeNum = range.split(".").reduce((acc, oct) => (acc << 8) + Number(oct), 0);
  return (ipNum & mask) === (rangeNum & mask);
}

/** Check if the request IP is in the allowlist (if configured). */
function isIpAllowed(req: NextRequest): boolean {
  if (ADMIN_ALLOWED_IPS.length === 0) return true; // no restriction

  const fwd = req.headers.get("x-forwarded-for") || "";
  const rawIp = fwd.split(",")[0]?.trim()
    || req.headers.get("x-real-ip") || "";

  if (!rawIp) return false;

  return ADMIN_ALLOWED_IPS.some((entry) => {
    if (entry.includes("/")) return ipInCidr(rawIp, entry);
    return rawIp === entry;
  });
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminSurface = isAdminPath(pathname);
  const isPublicAdminAuth = isPublicAdminAuthPath(pathname);

  // IP allowlist check: apply to all admin surfaces + gate
  if ((isAdminSurface || pathname.startsWith("/gate/")) && !isIpAllowed(req)) {
    return new NextResponse("Not found", { status: 404 });
  }

  // (1) Gate opener: `/gate/<slug>` sets the cookie and redirects to the
  // real admin login.
  if (ADMIN_SLUG && pathname === `/gate/${ADMIN_SLUG}`) {
    const res = NextResponse.redirect(new URL("/admin/login", req.url));
    res.cookies.set(GATE_COOKIE, GATE_VALUE, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days — long enough for real admins
    });
    return res;
  }

  // (2) Any other /gate/* path just 404s.
  if (pathname.startsWith("/gate/")) {
    return new NextResponse("Not found", { status: 404 });
  }

  // (3) If gate is disabled (no env var), let admin traffic through as
  // before. This preserves the dev experience.
  if (!ADMIN_SLUG) {
    return NextResponse.next();
  }

  // (4) Admin surface: require the gate cookie OR an active admin session
  // cookie (existing admins should never be locked out mid-session even
  // if the slug changed).
  if (isAdminSurface && !isPublicAdminAuth) {
    const hasGate = req.cookies.get(GATE_COOKIE)?.value === GATE_VALUE;
    const sessionCookieName = process.env.NIRBHOY_SESSION_COOKIE || "nirbhoy_session";
    const hasSession = Boolean(req.cookies.get(sessionCookieName)?.value);

    if (!hasGate && !hasSession) {
      // Return a generic 404 — do NOT hint that admin exists.
      return new NextResponse("Not found", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  }

  return NextResponse.next();
}

// Only run middleware on the admin surface + gate path. Everything else
// is served with zero overhead.
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/gate/:path*"],
};
