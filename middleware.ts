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
 * This is security-by-obscurity — the *real* authorization still lives in
 * Firebase Auth + Firestore admin claims. But it removes 99% of drive-by
 * traffic and eliminates the phishing target ("mydomain.com/admin/login").
 */

const GATE_COOKIE = "admin_gate";
const GATE_VALUE = "ok"; // opaque marker; presence is enough

// If NIRBHOY_ADMIN_SLUG isn't set, we disable the gate (dev mode default).
const ADMIN_SLUG = process.env.NIRBHOY_ADMIN_SLUG || "";

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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
  if (isAdminPath(pathname)) {
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
