/**
 * TOTP (Time-based One-Time Password) for admin 2FA.
 *
 * Uses `otplib` under the hood. Each admin gets their own secret stored
 * in Firestore at `admins/{uid}` document. The secret is only
 * ever revealed once — during setup — and then locked.
 *
 * Flow:
 *   1. Admin logs in with email+password → gets session cookie.
 *   2. Admin visits `/admin/security` → clicks "Set up 2FA".
 *   3. API returns a TOTP secret + otpauth:// URI (for QR code).
 *   4. Admin scans with authenticator app, enters a code to verify.
 *   5. On subsequent logins, the session API requires a TOTP code.
 */

import { generateSecret, generateURI, verify } from "otplib";
import { adminDb } from "./firebaseAdmin";
import { logger } from "./logger";

const ISSUER = "Nirbhoy";
const TOTP_COLLECTION = "admins";

/**
 * Generate a new TOTP secret for an admin. Returns the secret and a
 * otpauth:// URI the authenticator app can scan.
 * Does NOT persist anything yet — call verifyAndEnableTotp() after the
 * admin confirms they have the code working.
 */
export async function generateTotpSecret(uid: string, email: string) {
  const secret = generateSecret();
  const uri = generateURI({ issuer: ISSUER, label: email, secret });

  // Store the (unverified) secret temporarily so we can check the
  // verification code against it. We'll move it to the real field
  // once the admin confirms.
  const db = adminDb();
  await db.collection(TOTP_COLLECTION).doc(uid).update({
    _pendingTotpSecret: secret,
  });

  logger.info({ uid }, "TOTP secret generated (pending verification)");
  return { secret, uri };
}

/**
 * Verify a TOTP code against the admin's pending secret, then
 * permanently enable 2FA. Returns true on success.
 */
export async function verifyAndEnableTotp(uid: string, code: string) {
  const db = adminDb();
  const doc = await db.collection(TOTP_COLLECTION).doc(uid).get();
  if (!doc.exists) return false;

  const secret = doc.data()?._pendingTotpSecret;
  if (!secret) return false;

  const isValid = verify({ token: code, secret });
  if (!isValid) return false;

  // Move the secret to the permanent field and remove the pending one.
  await db.collection(TOTP_COLLECTION).doc(uid).update({
    totpSecret: secret,
    totpEnabledAt: new Date(),
    _pendingTotpSecret: null, // Firestore deletes if set to null
  });

  logger.info({ uid }, "TOTP 2FA enabled permanently");
  return true;
}

/**
 * Check if a given admin has 2FA enabled.
 */
export async function hasTotpEnabled(uid: string) {
  const db = adminDb();
  const doc = await db.collection(TOTP_COLLECTION).doc(uid).get();
  if (!doc.exists) return false;
  return Boolean(doc.data()?.totpSecret);
}

/**
 * Verify a TOTP code against the admin's stored secret.
 * Returns true if the code is valid or if 2FA is not enabled.
 * Returns false if the code is invalid.
 */
export async function verifyTotpCode(uid: string, code: string) {
  const db = adminDb();
  const doc = await db.collection(TOTP_COLLECTION).doc(uid).get();
  if (!doc.exists) return false;

  const secret = doc.data()?.totpSecret;
  if (!secret) return true; // 2FA not enabled → skip check

  if (!code) return false; // code required but missing
  return verify({ token: code, secret });
}

/**
 * Disable 2FA for an admin (e.g. if they lose their authenticator).
 */
export async function disableTotp(uid: string) {
  const db = adminDb();
  await db.collection(TOTP_COLLECTION).doc(uid).update({
    totpSecret: null,
    totpEnabledAt: null,
  });
  logger.info({ uid }, "TOTP 2FA disabled");
}