import { adminAuth, adminDb } from "./firebaseAdmin";

export const SESSION_COOKIE = process.env.NIRBHOY_SESSION_COOKIE || "nirbhoy_session";
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours

// Parses the raw cookie header — used in API routes (Pages Router doesn't
// always populate req.cookies for custom server setups, so do it by hand).
export function readCookie(req, name) {
  const header = req.headers?.cookie;
  if (!header) return null;
  const parts = header.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (part.startsWith(name + "=")) {
      return decodeURIComponent(part.slice(name.length + 1));
    }
  }
  return null;
}

export async function createSessionCookie(idToken) {
  return adminAuth().createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_MS });
}

export function sessionCookieHeader(cookieValue, maxAgeSeconds) {
  const secure = process.env.NODE_ENV === "production" ? "Secure; " : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(cookieValue)}; HttpOnly; ${secure}Path=/; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookieHeader() {
  return `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}

// Verifies the session cookie AND that the uid is on the admins allowlist
// in Firestore. Returns { uid, email } or null.
export async function verifyAdminSession(sessionCookieValue) {
  if (!sessionCookieValue) return null;
  try {
    const decoded = await adminAuth().verifySessionCookie(sessionCookieValue, true);
    const doc = await adminDb().collection("admins").doc(decoded.uid).get();
    if (!doc.exists) return null;
    return { uid: decoded.uid, email: decoded.email, ...doc.data() };
  } catch {
    return null;
  }
}

// Use inside API route handlers (pages/api/admin/**). Returns admin object
// or writes a 401 response and returns null.
export async function requireAdminApi(req, res) {
  const cookie = readCookie(req, SESSION_COOKIE);
  const admin = await verifyAdminSession(cookie);
  if (!admin) {
    res.status(401).json({ error: "Not authenticated." });
    return null;
  }
  return admin;
}

// Use inside getServerSideProps for pages/admin/** pages.
export async function requireAdminPage(context) {
  const cookie = context.req.cookies?.[SESSION_COOKIE];
  const admin = await verifyAdminSession(cookie);
  if (!admin) {
    return {
      redirect: { destination: "/admin/login", permanent: false },
    };
  }
  return { props: { admin: { uid: admin.uid, email: admin.email || null } } };
}
